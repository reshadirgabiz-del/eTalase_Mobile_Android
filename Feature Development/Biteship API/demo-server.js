'use strict';
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const { lookupAreaId, getRates, createOrder, trackShipment } =
  require('./biteship-procedures');
const { generateLabel } = require('./label-generator');

const app = express();
const PORT = process.env.DEMO_PORT || 3099;

app.use(express.json({ limit: '10mb' }));

// ── Static pages ───────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'demo.html')));

app.get('/label', (_req, res) => {
  const p = path.join(__dirname, 'shipping-label.html');
  if (fs.existsSync(p)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(p);
  } else {
    res.status(404).send('<p style="font:14px sans-serif;padding:20px">Label not generated yet — complete Step 2 first.</p>');
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Generate a realistic-looking demo AWB when sandbox returns WYB- test waybills.
 * Format mirrors real courier AWB structures.
 */
function generateDemoAWB(courierCode, orderId) {
  // Derive 12 digit-like chars from the Biteship order ID hex string
  const digits = (orderId || Date.now().toString())
    .split('')
    .map((c) => (c >= '0' && c <= '9' ? c : String((c.toLowerCase().charCodeAt(0) - 87) % 10)))
    .join('')
    .slice(0, 12)
    .padEnd(12, '0');

  const formats = {
    jne: `JNE${digits}`,
    sicepat: `031161${digits.slice(0, 8)}`,
    jnt: `JT${digits}`,
    anteraja: `${digits}`,
    id: `ID${digits}`,
  };
  return (formats[courierCode] || `DEMO${digits}`).slice(0, 16);
}

/**
 * Return a realistic simulated tracking response when sandbox returns 404.
 * Matches the shape of a real Biteship tracking response.
 */
function simulateTracking(waybill, courierCode) {
  const now = new Date();
  const ago = (min) => new Date(now - min * 60000).toISOString();
  return {
    success: true,
    object: 'tracking',
    waybill_id: waybill,
    courier: { company: courierCode, name: courierCode.toUpperCase() },
    status: 'waiting_to_pickup',
    history: [
      {
        note: 'Paket menunggu dijemput oleh kurir',
        status: 'waiting_to_pickup',
        updated_at: ago(0),
      },
      {
        note: 'Pesanan berhasil dibuat dan dikonfirmasi sistem',
        status: 'confirmed',
        updated_at: ago(3),
      },
    ],
  };
}

// ── POST /api/preview-label ────────────────────────────────────────────────────
// Generates a label from form data without calling Biteship — used to preview the store logo.
// Body: { input }
app.post('/api/preview-label', async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) return res.status(400).json({ success: false, error: 'input is required' });
    const mockOrder = {
      id: 'PREVIEW',
      courier: {
        waybill_id: 'PREVIEW-AWB-00000',
        name: input.courier?.company || 'COURIER',
        type: input.courier?.type || 'REG',
      },
    };
    await generateLabel(mockOrder, input, path.join(__dirname, 'shipping-label.html'));
    res.json({ success: true, labelUrl: '/label' });
  } catch (err) {
    console.error('[/api/preview-label]', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── POST /api/rates ────────────────────────────────────────────────────────────
// Body: { senderQuery, recipientQuery, items }
// Returns: { success, rates[], originAreaId, destAreaId }
app.post('/api/rates', async (req, res) => {
  try {
    const { senderQuery, recipientQuery, items } = req.body;
    if (!senderQuery || !recipientQuery) {
      return res.status(400).json({ success: false, error: 'senderQuery and recipientQuery are required' });
    }

    const [originAreaId, destAreaId] = await Promise.all([
      lookupAreaId(senderQuery),
      lookupAreaId(recipientQuery),
    ]);

    const rates = await getRates(originAreaId, destAreaId, items || []);
    res.json({ success: true, rates, originAreaId, destAreaId });
  } catch (err) {
    console.error('[/api/rates]', err.message);
    res.status(400).json({ success: false, error: err.message, detail: err.biteshipData });
  }
});

// ── POST /api/create-order ─────────────────────────────────────────────────────
// Body: { input, originAreaId, destAreaId }
// Returns: { success, order, awb, isDemo, sandboxWaybill, labelUrl }
app.post('/api/create-order', async (req, res) => {
  try {
    const { input, originAreaId, destAreaId } = req.body;
    const orderData = await createOrder(input, originAreaId, destAreaId);

    const rawWaybill = orderData?.courier?.waybill_id;
    const isSandbox = !rawWaybill || rawWaybill.startsWith('WYB-');
    const awb = isSandbox
      ? generateDemoAWB(input.courier.company, orderData.id)
      : rawWaybill;

    // Generate label with resolved AWB so the barcode reflects the display code
    const labelOrderData = {
      ...orderData,
      courier: { ...(orderData.courier || {}), waybill_id: awb },
    };
    await generateLabel(labelOrderData, input, path.join(__dirname, 'shipping-label.html'));

    res.json({
      success: true,
      order: {
        id: orderData.id,
        price: orderData.price,
        delivery_status: orderData.delivery?.status ?? null,
      },
      awb,
      sandboxWaybill: isSandbox ? rawWaybill : null,
      isDemo: isSandbox,
      labelUrl: '/label',
    });
  } catch (err) {
    console.error('[/api/create-order]', err.message);
    res.status(400).json({ success: false, error: err.message, detail: err.biteshipData });
  }
});

// ── POST /api/track ────────────────────────────────────────────────────────────
// Body: { waybill, courier }
// Returns: { success, tracking, simulated }
app.post('/api/track', async (req, res) => {
  try {
    const { waybill, courier } = req.body;
    if (!waybill || !courier) {
      return res.status(400).json({ success: false, error: 'waybill and courier are required' });
    }
    const tracking = await trackShipment(waybill, courier);
    res.json({ success: true, tracking, simulated: false });
  } catch (err) {
    if (err.biteshipStatus === 404) {
      // Sandbox / demo AWB — return simulated timeline
      res.json({
        success: true,
        tracking: simulateTracking(req.body.waybill, req.body.courier),
        simulated: true,
      });
    } else {
      console.error('[/api/track]', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n  e-talase × Biteship — Shipping Demo');
  console.log(`  http://localhost:${PORT}`);
  console.log('  Press Ctrl+C to stop\n');
});
