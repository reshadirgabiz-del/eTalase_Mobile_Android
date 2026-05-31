'use strict';
require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.BITESHIP_API_URL || 'https://api.biteship.com/v1';
const API_KEY = process.env.BITESHIP_API_KEY;

function biteshipHeaders() {
  return { Authorization: `Bearer ${API_KEY}` };
}

// Mirrors the error-handling pattern in Backend/src/delivery/delivery.service.ts:112-127
function handleBiteshipError(err, context) {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const msg =
      err.response?.data?.error ??
      err.response?.data?.message ??
      JSON.stringify(err.response?.data ?? err.message);
    console.error(`[Biteship ${context}] HTTP ${status}:`, msg);
    const e = new Error(`Biteship ${context} failed (${status}): ${msg}`);
    e.biteshipStatus = status;
    e.biteshipData = err.response?.data;
    throw e;
  }
  throw err;
}

/**
 * Resolve a human-readable Indonesian city/district to a Biteship area ID.
 * Direct port of DeliveryService.lookupAreaId() in Backend/src/delivery/delivery.service.ts
 *
 * NestJS equivalent: DeliveryService.lookupAreaId(query: string): Promise<string>
 *
 * @param {string} query - e.g. "Kemang, Jakarta Selatan" or "Rungkut, Surabaya"
 * @returns {Promise<string>} Biteship area ID
 */
async function lookupAreaId(query) {
  const res = await axios
    .get(`${API_URL}/maps/areas`, {
      params: { input: query, type: 'single', country_code: 'ID' },
      headers: biteshipHeaders(),
    })
    .catch((err) => handleBiteshipError(err, 'lookupAreaId'));

  const areas = res.data?.areas ?? [];
  if (!areas.length) {
    throw new Error(`Biteship area not found for query: "${query}"`);
  }

  const area = areas[0];
  console.log(
    `[lookupAreaId] "${query}" → ${area.id}` +
      (area.name ? ` (${area.name})` : ''),
  );
  return area.id;
}

/**
 * Fetch available courier rates between two Biteship area IDs.
 * Mirrors the rates block in DeliveryService.estimate() in delivery.service.ts:83-110
 *
 * NestJS equivalent: extract into DeliveryService.getRates() or ShipmentService.getRates()
 *
 * @param {string} originAreaId
 * @param {string} destinationAreaId
 * @param {Array<{name, value, weight, quantity}>} items
 * @returns {Promise<Array>} Biteship pricing array
 */
async function getRates(originAreaId, destinationAreaId, items) {
  const res = await axios
    .post(
      `${API_URL}/rates/couriers`,
      {
        origin_area_id: originAreaId,
        destination_area_id: destinationAreaId,
        couriers: 'jne,sicepat,jnt',
        items: items.map((i) => ({
          name: i.name,
          value: i.value,
          weight: i.weight,
          quantity: i.quantity,
        })),
      },
      { headers: biteshipHeaders() },
    )
    .catch((err) => handleBiteshipError(err, 'getRates'));

  const pricing = res.data?.pricing ?? [];
  console.log(`[getRates] Found ${pricing.length} courier option(s)`);
  return pricing;
}

/**
 * Create a Biteship shipment order via POST /v1/orders.
 * This is the critical missing piece not yet in the production backend.
 * The response includes the Biteship order ID and (eventually) the AWB/waybill_id.
 *
 * NestJS equivalent: ShipmentService.createOrder(dto: CreateShipmentDto): Promise<BiteshipOrder>
 * Called after payment confirmation (status → 'paid') so order is only created for paid orders.
 *
 * @param {object} input - Contents of dummy-input.json
 * @param {string} originAreaId - From lookupAreaId(input.sender.area_query)
 * @param {string} destAreaId - From lookupAreaId(input.recipient.area_query)
 * @returns {Promise<object>} Full Biteship order response
 */
async function createOrder(input, originAreaId, destAreaId) {
  const payload = {
    // Shipper identity (store)
    shipper_contact_name: input.sender.name,
    shipper_contact_phone: input.sender.phone,
    shipper_organization: 'e-talase Jastip',

    // Origin / pickup location
    origin_contact_name: input.sender.name,
    origin_contact_phone: input.sender.phone,
    origin_address: input.sender.address,
    origin_postal_code: parseInt(input.sender.postal_code, 10),
    origin_area_id: originAreaId,

    // Destination / recipient
    destination_contact_name: input.recipient.name,
    destination_contact_phone: input.recipient.phone,
    destination_address: input.recipient.address,
    destination_postal_code: parseInt(input.recipient.postal_code, 10),
    destination_area_id: destAreaId,
    destination_note: input.notes || '',

    // Courier selection
    courier_company: input.courier.company,
    courier_type: input.courier.type,
    courier_insurance: input.courier.insurance ? 1 : 0,

    // Delivery
    delivery_type: input.delivery_type,
    order_note: input.notes || '',

    // Items (dimensions in cm, weight in grams — all required by Biteship)
    items: input.items.map((item, idx) => ({
      id: `item-${idx + 1}`,
      name: item.name,
      description: item.description || item.name,
      value: item.value,
      weight: item.weight,
      height: item.height,
      length: item.length,
      width: item.width,
      quantity: item.quantity,
    })),

    // Internal reference stored in Biteship metadata
    metadata: {
      order_reference: input.order_reference,
      platform: 'e-talase',
    },
  };

  // Append COD block only when enabled (avoid sending cod: null to Biteship)
  if (input.cod?.enabled) {
    payload.cod = {
      type: 'cash',
      amount: input.cod.amount,
      fee_bearer: 'shipper',
    };
  }

  console.log(
    `[createOrder] Sending order to Biteship: ${input.courier.company.toUpperCase()} ${input.courier.type}`,
  );

  const res = await axios
    .post(`${API_URL}/orders`, payload, { headers: biteshipHeaders() })
    .catch((err) => handleBiteshipError(err, 'createOrder'));

  const order = res.data;
  console.log(`[createOrder] Biteship Order ID : ${order.id}`);
  console.log(
    `[createOrder] Waybill ID       : ${order.courier?.waybill_id ?? '(pending — assigned at courier pickup)'}`,
  );
  console.log(
    `[createOrder] Shipping Price   : Rp ${(order.price ?? 0).toLocaleString('id-ID')}`,
  );
  console.log(
    `[createOrder] Delivery Status  : ${order.delivery?.status ?? '-'}`,
  );

  return order;
}

/**
 * Track a shipment by AWB/waybill number and courier code.
 * Direct port of OrdersService.getShipmentTracking() in Backend/src/orders/orders.service.ts:739-744
 *
 * NestJS equivalent: OrdersService.getShipmentTracking() — already implemented in production
 *
 * @param {string} waybillId - AWB number from createOrder response (courier.waybill_id)
 * @param {string} courierCode - e.g. "jne", "sicepat", "jnt"
 * @returns {Promise<object>} Biteship tracking response
 */
async function trackShipment(waybillId, courierCode) {
  console.log(
    `[trackShipment] Tracking ${waybillId} via ${courierCode.toUpperCase()}...`,
  );

  const res = await axios
    .get(`${API_URL}/trackings/${waybillId}/${courierCode}`, {
      headers: biteshipHeaders(),
    })
    .catch((err) => handleBiteshipError(err, 'trackShipment'));

  const data = res.data;
  console.log(`[trackShipment] Status : ${data?.status ?? '-'}`);
  if (data?.history?.length) {
    console.log(`[trackShipment] Latest : ${data.history[0]?.note ?? '-'}`);
  }
  return data;
}

module.exports = { lookupAreaId, getRates, createOrder, trackShipment };
