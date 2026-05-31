'use strict';
const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');

// e-talase logos — two levels up from this folder
const LOGO_SVG_PATH = path.resolve(__dirname, '../../Assets/logo.svg');
const LOGO_PNG_PATH = path.resolve(__dirname, '../../Assets/logo.png');
// Keep old name as alias for the header (uses SVG)
const LOGO_PATH = LOGO_SVG_PATH;

// Courier logo assets directory — add {courier-slug}.svg or .png here
const COURIER_LOGO_DIR = path.resolve(__dirname, 'assets/couriers');

/**
 * Resolve the header logo HTML.
 * Non-free plans with a valid store.logo_path get the store logo;
 * everyone else (including free plans) sees the e-talase logo.
 *
 * Supported formats: .svg (inlined), .png / .jpg / .jpeg (base64 data URL).
 */
function resolveHeaderLogo(input) {
  const store = input.store || {};
  const isFreePlan = !store.plan || store.plan === 'free';

  if (!isFreePlan) {
    // Data URL from browser upload — use directly
    if (store.logo_data_url && store.logo_data_url.startsWith('data:')) {
      return `<img src="${store.logo_data_url}" alt="Store Logo" height="30" style="display:block;object-fit:contain">`;
    }
    // File path from dummy-input / programmatic use
    if (store.logo_path) {
      try {
        const logoPath = path.resolve(store.logo_path);
        const ext = path.extname(logoPath).toLowerCase();
        if (ext === '.svg') {
          let svg = fs.readFileSync(logoPath, 'utf8');
          svg = svg.replace(/(<svg)(\s)/i, '$1 width="150" height="30" style="display:block;padding:auto;box-sizing:content-box"$2');
          return svg;
        } else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
          const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
          const b64 = fs.readFileSync(logoPath).toString('base64');
          return `<img src="data:${mime};base64,${b64}" alt="Store Logo" height="30" style="display:block;object-fit:contain">`;
        }
      } catch {
        // fall through to e-talase logo
      }
    }
  }

  try {
    let svg = fs.readFileSync(LOGO_PATH, 'utf8');
    svg = svg.replace(/(<svg)(\s)/i, '$1 width="150" height="30" style="display:block;padding:auto;box-sizing:content-box"$2');
    return svg;
  } catch {
    return '<span style="font-weight:bold;font-size:15px;color:#5d6b40">e-talase</span>';
  }
}

/**
 * Try to load a courier logo from assets/couriers/{slug}.svg or .png.
 * Returns an HTML string (inline SVG or <img>), or empty string if not found.
 */
function loadCourierLogo(courierName) {
  const slug = courierName.toLowerCase().replace(/\s+/g, '-');
  const svgPath = path.join(COURIER_LOGO_DIR, `${slug}.svg`);
  if (fs.existsSync(svgPath)) {
    try {
      let svg = fs.readFileSync(svgPath, 'utf8');
      svg = svg.replace(/(<svg)(\s)/i, '$1 style="height:48px;max-width:120px;display:block;object-fit:contain"$2');
      return svg;
    } catch { /* fall through */ }
  }
  const pngPath = path.join(COURIER_LOGO_DIR, `${slug}.png`);
  if (fs.existsSync(pngPath)) {
    try {
      const b64 = fs.readFileSync(pngPath).toString('base64');
      return `<img src="data:image/png;base64,${b64}" alt="${courierName}" style="height:48px;max-width:120px;display:block;object-fit:contain">`;
    } catch { /* fall through */ }
  }
  // Also check .jpg / .jpeg
  for (const ext of ['.jpg', '.jpeg']) {
    const jpgPath = path.join(COURIER_LOGO_DIR, `${slug}${ext}`);
    if (fs.existsSync(jpgPath)) {
      try {
        const b64 = fs.readFileSync(jpgPath).toString('base64');
        return `<img src="data:image/jpeg;base64,${b64}" alt="${courierName}" style="height:48px;max-width:120px;display:block;object-fit:contain">`;
      } catch { /* fall through */ }
    }
  }
  // Also check .webp
  const webpPath = path.join(COURIER_LOGO_DIR, `${slug}.webp`);
  if (fs.existsSync(webpPath)) {
    try {
      const b64 = fs.readFileSync(webpPath).toString('base64');
      return `<img src="data:image/webp;base64,${b64}" alt="${courierName}" style="height:48px;max-width:120px;display:block;object-fit:contain">`;
    } catch { /* fall through */ }
  }
  return '';
}

/**
 * Generate a Code128 barcode as a PNG data URL using bwip-js.
 * Code128 is the standard 1D symbology used on shipping labels worldwide.
 *
 * @param {string} text - AWB number or order reference to encode
 * @returns {Promise<string>} data:image/png;base64,... URL
 */
async function generateBarcode(text) {
  const png = await bwipjs.toBuffer({
    bcid: 'code128',
    text: String(text),
    scale: 3,
    height: 14,
    includetext: false,
    backgroundcolor: 'ffffff',
    barcolor: '000000',
  });
  return `data:image/png;base64,${png.toString('base64')}`;
}

/**
 * Build a short routing code when Biteship doesn't provide one.
 * Pattern: ORIGIN_ABBREV-DEST_ABBREV-SERVICE  e.g. JKTS-SBY-REG
 */
function buildRoutingCode(orderData, input) {
  const fromBiteship =
    orderData?.courier?.routing_code ??
    orderData?.destination?.routing_code ??
    null;
  if (fromBiteship) return fromBiteship;

  function abbrev(city) {
    return (city || '')
      .replace(/jakarta selatan/i, 'JKTS')
      .replace(/jakarta utara/i, 'JKTU')
      .replace(/jakarta timur/i, 'JKTT')
      .replace(/jakarta barat/i, 'JKTB')
      .replace(/jakarta pusat/i, 'JKTP')
      .replace(/jakarta/i, 'JKT')
      .replace(/surabaya/i, 'SBY')
      .replace(/bandung/i, 'BDG')
      .replace(/medan/i, 'MDN')
      .replace(/makassar/i, 'MKS')
      .replace(/semarang/i, 'SMG')
      .replace(/yogyakarta/i, 'YOG')
      .replace(/\s+/g, '')
      .toUpperCase()
      .slice(0, 6);
  }

  const orig = abbrev(input.sender.city);
  const dest = abbrev(input.recipient.city);
  const svc = (input.courier.type || 'REG').toUpperCase();
  return `${orig}-${dest}-${svc}`;
}

/** Format Indonesian mobile number: 081234567890 → +62 812-3456-7890 */
function formatPhone(raw) {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('08') && digits.length >= 10) {
    const local = digits.slice(1);
    const part1 = local.slice(0, 3);
    const part2 = local.slice(3, 7);
    const part3 = local.slice(7);
    return `+62 ${part1}-${part2}-${part3}`;
  }
  return raw;
}

/** Format as Indonesian Rupiah: 150000 → "Rp 150.000" */
function rupiah(amount) {
  return `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;
}

/**
 * Generate an A6-landscape print-ready HTML shipping label.
 *
 * Label sections:
 *   HEADER  — e-talase logo | routing code | courier name + service
 *   ADDRESS — Sender (From) | Recipient (To)
 *   BARCODE — Code128 barcode + AWB text
 *   FOOTER  — qty, weight, goods type, notes, COD badge
 *
 * NestJS equivalent: ShipmentService.generateLabel() or a dedicated LabelService
 *
 * @param {object} orderData - Response from createOrder() (or a partial mock for testing)
 * @param {object} input     - dummy-input.json contents
 * @param {string} [outPath] - Output file path (default: ./shipping-label.html)
 * @returns {Promise<string>} Resolved path of the written HTML file
 */
async function generateLabel(orderData, input, outPath) {
  const outputPath =
    outPath || path.resolve(__dirname, 'shipping-label.html');

  // Resolve AWB: prefer waybill_id, fall back to Biteship order id, then local reference
  const awbNumber =
    orderData?.courier?.waybill_id ||
    orderData?.id ||
    input.order_reference ||
    'PENDING-AWB';

  const courierName = (
    orderData?.courier?.name ||
    input.courier.company ||
    ''
  ).toUpperCase();
  const serviceType = (
    orderData?.courier?.type ||
    input.courier.type ||
    ''
  ).toUpperCase();
  const routingCode = buildRoutingCode(orderData, input);

  const totalWeightG = input.items.reduce(
    (s, i) => s + i.weight * i.quantity,
    0,
  );
  const totalQty = input.items.reduce((s, i) => s + i.quantity, 0);
  const goodsTypes = [...new Set(input.items.map((i) => i.type || i.name))]
    .join(', ');
  const codAmount = input.cod?.enabled ? (input.cod.amount || 0) : 0;

  // Resolve header logo (store logo on paid plans, e-talase logo on free/default)
  const headerLogoHtml = resolveHeaderLogo(input);

  // Resolve courier logo (image from assets/couriers/ if available, else text)
  const courierLogoHtml = loadCourierLogo(courierName);

  // Resolve e-talase logo for "Powered by" strip — uses logo.png (always shown)
  let poweredByLogoHtml;
  try {
    const b64 = fs.readFileSync(LOGO_PNG_PATH).toString('base64');
    poweredByLogoHtml = `<img src="data:image/png;base64,${b64}" alt="e-talase" width="36" height="16" style="display:inline-block;vertical-align:middle;object-fit:contain">`;
  } catch {
    poweredByLogoHtml = '<span style="font-weight:bold;color:#5d6b40">e-talase</span>';
  }

  // Generate barcode as embedded PNG
  const barcodeDataUrl = await generateBarcode(awbNumber);

  const codBg = codAmount > 0 ? '#d32f2f' : '#e0e0e0';
  const codColor = codAmount > 0 ? '#fff' : '#888';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Label Pengiriman — ${awbNumber}</title>
  <style>
    @page {
      size: 148mm 105mm landscape;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, 'Helvetica Neue', sans-serif;
      font-size: 8pt;
      width: 148mm;
      height: 105mm;
      overflow: hidden;
      background: #fff;
    }

    /* ── Outer container ── */
    .label {
      width: 148mm;
      height: 105mm;
      border: 1.5px solid #333;
      display: flex;
      flex-direction: column;
    }

    /* ── HEADER ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2mm 3mm;
      border-bottom: 1px solid #333;
      height: 20mm;
      flex-shrink: 0;
      gap: 2mm;
    }
    .header-logo { flex: 0 0 auto; }
    .header-routing {
      flex: 1;
      text-align: center;
      font-size: 7pt;
      color: #555;
      line-height: 1.4;
    }
    .header-routing strong { font-size: 8.5pt; color: #222; letter-spacing: 0.5px; }
    .header-courier {
      flex: 0 0 auto;
      text-align: right;
    }
    .courier-name {
      font-size: 15pt;
      font-weight: bold;
      letter-spacing: 1px;
      line-height: 1;
    }
    .courier-service {
      font-size: 8.5pt;
      color: #555;
      margin-top: 1px;
    }

    /* ── ADDRESS ROW ── */
    .addresses {
      display: flex;
      border-bottom: 1px solid #333;
      height: 28mm;
      flex-shrink: 0;
    }
    .addr {
      flex: 1;
      padding: 2mm 3mm;
      font-size: 7.5pt;
      line-height: 1.45;
      overflow: hidden;
    }
    .addr + .addr { border-left: 1px solid #333; }
    .addr-label {
      font-size: 6pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      margin-bottom: 1mm;
    }
    .addr-name { font-size: 9pt; font-weight: bold; }
    .addr-phone { color: #333; margin-top: 0.5mm; }

    /* ── BARCODE ── */
    .barcode-row {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2mm 4mm 1mm;
      border-bottom: 1px solid #333;
      flex: 1;
      overflow: hidden;
    }
    .barcode-img {
      max-width: 136mm;
      height: 16mm;
      object-fit: fill;
      display: block;
    }
    .awb-text {
      font-family: 'Courier New', Courier, monospace;
      font-size: 9.5pt;
      font-weight: bold;
      letter-spacing: 2.5px;
      margin-top: 1.5mm;
    }

    /* ── FOOTER ── */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 2mm 3mm;
      height: 13mm;
      flex-shrink: 0;
      font-size: 7pt;
      line-height: 1.55;
      background: #f5f5f5;
    }
    .footer-left { flex: 1; }
    .footer-right { flex: 0 0 auto; text-align: right; }
    .lbl { font-weight: bold; color: #555; }
    .cod-badge {
      display: inline-block;
      background: ${codBg};
      color: ${codColor};
      padding: 1mm 2.5mm;
      border-radius: 3px;
      font-weight: bold;
      font-size: 7.5pt;
      margin-top: 1mm;
    }

    /* ── POWERED BY ── */
    .powered-by {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 5mm;
      flex-shrink: 0;
      border-top: 0.5px solid #ddd;
      background: #f4ece0;
      gap: 1.5mm;
      font-size: 5pt;
      color: #999;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }

    /* ── COURIER LOGO (when image replaces text) ── */
    .courier-logo { display: block; }
  </style>
</head>
<body>
<div class="label">

  <!-- HEADER: logo | routing | courier -->
  <div class="header">
    <div class="header-logo" style="width:30%;display:flex;align-items:center;justify-content:center">${headerLogoHtml}</div>
    <div class="header-routing">
      Kode Rute<br>
      <strong>${routingCode}</strong>
    </div>
    <div class="header-courier" style="width:30%;align-items:center;justify-content:center;display:flex;gap:5px">
      ${courierLogoHtml
        ? `<div class="courier-logo">${courierLogoHtml}</div>`
        : `<div class="courier-name">${courierName}</div>`}
      <div class="courier-service" style="background:grey;color:white;height:fit-content;width:100%;max-width:4rem;padding:2px;text-align:center">${serviceType}</div>
    </div>
  </div>

  <!-- ADDRESSES -->
  <div class="addresses">
    <div class="addr">
      <div class="addr-label">Pengirim (From)</div>
      <div class="addr-name">${input.sender.name}</div>
      <div>${input.sender.address}</div>
      <div>${input.sender.city}, ${input.sender.province} ${input.sender.postal_code}</div>
      <div class="addr-phone">${formatPhone(input.sender.phone)}</div>
    </div>
    <div class="addr">
      <div class="addr-label">Penerima (To)</div>
      <div class="addr-name">${input.recipient.name}</div>
      <div>${input.recipient.address}</div>
      <div>${input.recipient.city}, ${input.recipient.province} ${input.recipient.postal_code}</div>
      <div class="addr-phone">${formatPhone(input.recipient.phone)}</div>
    </div>
  </div>

  <!-- BARCODE + AWB -->
  <div class="barcode-row">
    <img class="barcode-img" src="${barcodeDataUrl}" alt="Barcode AWB ${awbNumber}">
    <div class="awb-text">${awbNumber}</div>
  </div>

  <!-- FOOTER: details + COD -->
  <div class="footer">
    <div class="footer-left">
      <span class="lbl">Qty:</span> ${totalQty} pcs &nbsp;|&nbsp;
      <span class="lbl">Berat:</span> ${totalWeightG} g &nbsp;|&nbsp;
      <span class="lbl">Jenis:</span> ${goodsTypes}<br>
      <span class="lbl">Catatan:</span> ${input.notes || '-'}
    </div>
    <div class="footer-right">
      <div class="cod-badge">COD: ${rupiah(codAmount)}</div>
    </div>
  </div>

  <!-- POWERED BY: always present -->
  <div class="powered-by">
    Powered by&nbsp;${poweredByLogoHtml}
  </div>

</div>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`[generateLabel] Label written → ${outputPath}`);
  return outputPath;
}

module.exports = { generateLabel, generateBarcode, buildRoutingCode };
