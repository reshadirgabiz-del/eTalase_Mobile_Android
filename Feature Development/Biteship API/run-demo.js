'use strict';
require('dotenv').config();
const path = require('path');

const input = require('./dummy-input.json');
const { lookupAreaId, getRates, createOrder, trackShipment } =
  require('./biteship-procedures');
const { generateLabel } = require('./label-generator');

function separator(title) {
  console.log(`\n${'─'.repeat(52)}`);
  console.log(` STEP: ${title}`);
  console.log('─'.repeat(52));
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  e-talase × Biteship API — Feature Dev Demo      ║');
  console.log('╚══════════════════════════════════════════════════╝');

  // ── STEP 1: Resolve area IDs ────────────────────────────────
  separator('1 — Lookup Area IDs (Biteship /maps/areas)');
  const [originAreaId, destAreaId] = await Promise.all([
    lookupAreaId(input.sender.area_query),
    lookupAreaId(input.recipient.area_query),
  ]);
  console.log(`\nOrigin area ID      : ${originAreaId}`);
  console.log(`Destination area ID : ${destAreaId}`);

  // ── STEP 2: Get courier rates ───────────────────────────────
  separator('2 — Get Courier Rates (Biteship /rates/couriers)');
  const rates = await getRates(originAreaId, destAreaId, input.items);
  const top = rates.slice(0, 5);
  if (top.length) {
    console.log('\nTop options:');
    top.forEach((r) => {
      console.log(
        `  ${(r.courier_name || '').padEnd(10)} ${(r.courier_service_name || '').padEnd(6)}` +
        `  Rp ${(r.price || 0).toLocaleString('id-ID').padStart(9)}` +
        `  (${r.shipment_duration_range ?? '-'} hari)`,
      );
    });
  } else {
    console.log('No rates returned (check area IDs above).');
  }

  // ── STEP 3: Create Biteship order ──────────────────────────
  separator('3 — Create Biteship Order (POST /v1/orders)');
  const orderData = await createOrder(input, originAreaId, destAreaId);

  console.log('\nResponse summary:');
  console.log(
    JSON.stringify(
      {
        id: orderData.id,
        price: orderData.price,
        delivery_status: orderData.delivery?.status,
        waybill_id: orderData.courier?.waybill_id,
        tracking_id: orderData.courier?.tracking_id,
        label_url: orderData.label_url ?? null,
      },
      null,
      2,
    ),
  );

  // ── STEP 4: Generate shipping label ────────────────────────
  separator('4 — Generate HTML Shipping Label');
  const labelPath = await generateLabel(
    orderData,
    input,
    path.resolve(__dirname, 'shipping-label.html'),
  );
  console.log(`\nOpen in browser: file://${labelPath}`);
  console.log('Print → Paper: A6 · Landscape · No margins');

  // ── STEP 5: Track shipment ─────────────────────────────────
  separator('5 — Track Shipment (Biteship /trackings)');
  const waybill = orderData?.courier?.waybill_id;
  const courierCode = input.courier.company;

  if (waybill) {
    try {
      const tracking = await trackShipment(waybill, courierCode);
      console.log('\nTracking response:');
      console.log(JSON.stringify(tracking, null, 2));
    } catch (err) {
      if (err.biteshipStatus === 404) {
        console.log(`\nTracking returned 404 for waybill: ${waybill}`);
        console.log('This is expected in sandbox — test waybills (WYB-...) have no real');
        console.log('courier route. In production, the courier assigns a real AWB number.');
        console.log('\nTo test tracking manually with a real AWB (once available), run:');
        console.log(
          `  node -e "require('dotenv').config(); require('./biteship-procedures').trackShipment('REAL_AWB_HERE', '${courierCode}').then(r => console.log(JSON.stringify(r, null, 2)))"`,
        );
      } else {
        throw err;
      }
    }
  } else {
    console.log('\nWaybill ID is not yet assigned — normal in sandbox immediately after order creation.');
    console.log('The AWB is assigned when the courier picks up the package.');
    console.log(`\nTo track manually once you have the waybill, run:`);
    console.log(
      `  node -e "require('dotenv').config(); require('./biteship-procedures').trackShipment('<WAYBILL_ID>', '${courierCode}').then(r => console.log(JSON.stringify(r, null, 2)))"`,
    );
  }

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Demo complete. Check shipping-label.html         ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
}

main().catch((err) => {
  console.error('\n[FATAL]', err.message);
  if (err.biteshipData) {
    console.error(
      '[Biteship error detail]',
      JSON.stringify(err.biteshipData, null, 2),
    );
  }
  process.exit(1);
});
