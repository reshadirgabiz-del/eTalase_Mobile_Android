# Biteship API — Feature Development Prototype

Self-contained Node.js prototype for the **Biteship order creation + shipping label + tracking** flow.
Not yet in production. Each function converts directly to a NestJS injectable service method.

---

## Prerequisites

- Node.js 18+
- The sandbox API key is already pre-filled in `.env` (copied from `Backend/.env`)

---

## Setup

```bash
cd "Feature Development/Biteship API"
npm install
```

That's it. The `.env` file already contains the sandbox key.

---

## Run the Full Demo

```bash
node run-demo.js
# or
npm run demo
```

Runs all 5 steps sequentially and writes `shipping-label.html`:

| Step | What happens |
|---|---|
| 1 | Resolves Jakarta Selatan + Surabaya to Biteship area IDs |
| 2 | Fetches available courier rates (JNE, SiCepat, J&T) |
| 3 | Creates a Biteship order → returns order ID + price + (eventual) AWB |
| 4 | Generates `shipping-label.html` with barcode, e-talase logo, all fields |
| 5 | Tracks by AWB (skipped if waybill not yet assigned — normal in sandbox) |

---

## Test Individual Steps

### Step 1 — Area ID lookup

```bash
npm run lookup
# or
node -e "require('dotenv').config(); require('./biteship-procedures').lookupAreaId('Bandung, Jawa Barat').then(console.log)"
```

Expected output: a string like `IDNP...` or `IDA3...`.

### Step 2 — Get courier rates

```bash
npm run rates
```

Expected output: a JSON array of 5+ courier options with `price`, `courier_name`, `courier_service_name`.

### Step 3 — Create order (uses dummy-input.json)

```bash
node -e "
require('dotenv').config();
const p = require('./biteship-procedures');
const d = require('./dummy-input.json');
Promise.all([
  p.lookupAreaId(d.sender.area_query),
  p.lookupAreaId(d.recipient.area_query)
]).then(([o, de]) => p.createOrder(d, o, de).then(r => console.log(JSON.stringify(r, null, 2))))
"
```

### Step 4 — Generate label only (with a mock order)

```bash
node -e "
require('dotenv').config();
const { generateLabel } = require('./label-generator');
const input = require('./dummy-input.json');
const mockOrder = { id: 'MOCK-ORDER-001', courier: { name: 'JNE', type: 'REG', waybill_id: null } };
generateLabel(mockOrder, input).then(p => console.log('Label at:', p))
"
```

Then open `shipping-label.html` in your browser.

### Step 5 — Track a shipment manually

```bash
node -e "
require('dotenv').config();
require('./biteship-procedures')
  .trackShipment('YOUR_WAYBILL_ID_HERE', 'jne')
  .then(r => console.log(JSON.stringify(r, null, 2)))
"
```

Replace `YOUR_WAYBILL_ID_HERE` with the `waybill_id` from a previous `createOrder` response.

---

## View the Shipping Label

1. Open `shipping-label.html` in Chrome or Firefox
2. To print: **File → Print** (or Ctrl+P / Cmd+P)
   - Paper size: **A6**
   - Orientation: **Landscape**
   - Margins: **None**
3. The label contains:
   - e-talase store logo (top-left)
   - Routing code (center header) — e.g. `JKTS-SBY-REG`
   - Courier name + service type (top-right) — e.g. `JNE · REG`
   - Sender address (left column)
   - Recipient address (right column)
   - AWB number as Code128 barcode + plain text
   - Item quantity, total weight, goods type
   - Notes
   - COD badge (grey = Rp 0, red = active COD amount)

---

## Edge Case Testing

### Enable COD
Edit `dummy-input.json`:
```json
"cod": { "enabled": true, "amount": 150000 }
```
Re-run the demo → label footer shows a red **COD: Rp 150.000** badge.

### Change courier
Edit `dummy-input.json`:
```json
"courier": { "company": "sicepat", "type": "reg", "insurance": false }
```
Re-run → label shows `SICEPAT · BEST`.

### Test invalid API key
Edit `.env`: `BITESHIP_API_KEY=invalid_key`
Re-run → expect a clean `HTTP 401` error message, no crash.

### Test unknown city
```bash
node -e "require('dotenv').config(); require('./biteship-procedures').lookupAreaId('KotaYangTidakAda').catch(e => console.error(e.message))"
```
Expected: error message `Biteship area not found for query: "KotaYangTidakAda"`.

---

## Sandbox Behavior Notes

- **`waybill_id` is `null`** immediately after order creation. The AWB is assigned when the courier physically scans the package at pickup. This is expected — `id` (Biteship order ID) is the tracking reference until then.
- **`price: 0`** may appear for some courier+area combinations in sandbox. This is a sandbox limitation, not a production bug.
- **`label_url`** in the response may be null in sandbox. Our custom HTML label is generated regardless.
- Biteship sandbox does not send actual packages — orders are for testing API flows only.

---

## Nominatim Address Verification

The addresses in `dummy-input.json` are verifiable on [nominatim.openstreetmap.org](https://nominatim.openstreetmap.org):

| Location | Search query |
|---|---|
| Sender | `Kemang, Mampang Prapatan, Jakarta Selatan` |
| Recipient | `Rungkut, Surabaya, Jawa Timur` |

These are real Indonesian districts resolvable by Biteship's `/maps/areas` endpoint.

---

## Migrating to NestJS

Each function in `biteship-procedures.js` maps directly to a NestJS service method:

| JS function | NestJS method | Target module |
|---|---|---|
| `lookupAreaId(query)` | `lookupAreaId(query: string)` | `ShipmentService` (new) |
| `getRates(o, d, items)` | Extract from `DeliveryService.estimate()` | `DeliveryService` (existing) |
| `createOrder(input, o, d)` | `createOrder(dto: CreateShipmentDto)` | `ShipmentService` (new) |
| `trackShipment(w, c)` | Already in `OrdersService.getShipmentTracking()` | `OrdersService` (existing) |

**New DB columns needed on `orders` table:**
```sql
ALTER TABLE orders ADD COLUMN biteship_order_id text;
ALTER TABLE orders ADD COLUMN label_url text;
-- tracking_number column already exists — receives waybill_id
```

**When to call `createOrder` in production:**
After payment is confirmed (`status` transitions to `'paid'`), not at order creation time — so Biteship only receives orders for paid shipments.

**Label generation in production:**
Move `label-generator.js` logic into a `LabelService` or a dedicated endpoint
(`GET /orders/:id/label`) that streams the HTML/PDF response.
