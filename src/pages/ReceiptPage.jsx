import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Printer,
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';

function money(value) {
  return Number(value || 0).toLocaleString(
    'en-PH',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function readablePaymentMethod(value) {
  const method = String(value || 'cash')
    .trim()
    .toLowerCase();

  const labels = {
    cash: 'Cash',
    card: 'Card',
    gcash: 'GCash',
    paymaya: 'PayMaya'
  };

  return labels[method] || method;
}

function getItemName(item) {
  return (
    item?.name ||
    item?.product?.name ||
    'Product'
  );
}

function getItemBarcode(item) {
  return (
    item?.barcode ||
    item?.product?.barcode ||
    ''
  );
}

function getItemSubtotal(item) {
  const quantity = Number(item?.quantity || 0);
  const unitPrice = Number(item?.unitPrice || 0);

  return Number(
    item?.subtotal ??
      quantity * unitPrice
  );
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getReceiptData(sale) {
  const items = Array.isArray(sale?.items)
    ? sale.items
    : [];

  const totalItems = items.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  const calculatedTotal = items.reduce(
    (total, item) =>
      total + getItemSubtotal(item),
    0
  );

  const totalAmount = Number(
    sale?.totalAmount ?? calculatedTotal
  );

  const receiptNumber =
    sale?.receiptNumber ||
    sale?.reference ||
    '—';

  const dateTime =
    sale?.createdAt ||
    sale?.timestamp ||
    sale?.date;

  const cashierName =
    sale?.cashier?.fullName ||
    sale?.cashier?.name ||
    sale?.cashierName ||
    'Cashier';

  const paymentMethod = readablePaymentMethod(
    sale?.paymentMethod
  );

  return {
    items,
    totalItems,
    totalAmount,
    receiptNumber,
    dateTime,
    cashierName,
    paymentMethod
  };
}

function buildReceiptHtml(sale, qrDataUrl) {
  const {
    items,
    totalItems,
    totalAmount,
    receiptNumber,
    dateTime,
    cashierName,
    paymentMethod
  } = getReceiptData(sale);

  const itemRows = items
    .map(item => {
      const name = escapeHtml(
        getItemName(item)
      );

      const barcode = escapeHtml(
        getItemBarcode(item)
      );

      const quantity = Number(
        item.quantity || 0
      );

      const unitPrice = Number(
        item.unitPrice || 0
      );

      const subtotal = getItemSubtotal(item);

      return `
        <tr>
          <td>
            <strong>${name}</strong>
            ${
              barcode
                ? `<small>${barcode}</small>`
                : ''
            }
            <small>₱${money(unitPrice)} each</small>
          </td>
          <td>${quantity}</td>
          <td>₱${money(subtotal)}</td>
        </tr>
      `;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Receipt ${escapeHtml(receiptNumber)}</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 24px;
      background: #f5f5f5;
      color: #172033;
      font-family: Arial, sans-serif;
    }

    .receipt {
      width: 100%;
      max-width: 520px;
      margin: 0 auto;
      padding: 28px;
      background: #ffffff;
      border: 1px solid #dddddd;
      border-radius: 10px;
    }

    header {
      padding-bottom: 16px;
      border-bottom: 1px solid #eeeeee;
      text-align: center;
    }

    h1 {
      margin: 0;
      font-size: 22px;
    }

    header p {
      margin: 6px 0 0;
      color: #64748b;
      font-size: 13px;
    }

    .receipt-number {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 20px;
      padding: 12px;
      border-radius: 8px;
      background: #f0fdf4;
      color: #166534;
      font-size: 12px;
    }

    .receipt-number strong {
      overflow-wrap: anywhere;
      text-align: right;
    }

    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin: 18px 0;
      font-size: 12px;
    }

    .meta span {
      display: block;
      margin-bottom: 4px;
      color: #64748b;
    }

    .meta strong {
      display: block;
      overflow-wrap: anywhere;
    }

    hr {
      margin: 18px 0;
      border: 0;
      border-top: 1px dashed #94a3b8;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th {
      padding-bottom: 8px;
      border-bottom: 1px solid #cbd5e1;
      color: #64748b;
      font-size: 11px;
      text-align: left;
      text-transform: uppercase;
    }

    th:nth-child(2),
    td:nth-child(2) {
      width: 50px;
      text-align: center;
    }

    th:last-child,
    td:last-child {
      width: 90px;
      text-align: right;
    }

    td {
      padding: 10px 0;
      vertical-align: top;
    }

    td strong,
    td small {
      display: block;
    }

    td small {
      margin-top: 4px;
      color: #64748b;
      font-size: 10px;
    }

    .summary {
      display: flex;
      justify-content: space-between;
      padding-top: 10px;
      font-size: 13px;
    }

    .total {
      display: flex;
      justify-content: space-between;
      margin-top: 18px;
      padding-top: 14px;
      border-top: 2px solid #172033;
      font-size: 20px;
      font-weight: 800;
    }

    .total strong {
      color: #15803d;
    }

    .qr {
      margin-top: 26px;
      text-align: center;
    }

    .qr img {
      display: block;
      width: 150px;
      height: 150px;
      margin: 0 auto;
    }

    .qr p {
      margin: 8px 0 0;
      color: #64748b;
      font-size: 11px;
    }

    footer {
      margin-top: 22px;
      padding-top: 16px;
      border-top: 1px solid #eeeeee;
      color: #64748b;
      font-size: 11px;
      text-align: center;
    }

    footer strong {
      display: block;
      color: #172033;
      font-size: 13px;
    }

    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }

      .receipt {
        max-width: none;
        border: 0;
        border-radius: 0;
      }
    }
  </style>
</head>

<body>
  <main class="receipt">
    <header>
      <h1>Essential Supermarket</h1>
      <p>Official Receipt</p>
    </header>

    <div class="receipt-number">
      <span>Receipt number</span>
      <strong>${escapeHtml(receiptNumber)}</strong>
    </div>

    <div class="meta">
      <div>
        <span>Date and time</span>
        <strong>${escapeHtml(
          formatDateTime(dateTime)
        )}</strong>
      </div>

      <div>
        <span>Cashier</span>
        <strong>${escapeHtml(cashierName)}</strong>
      </div>

      <div>
        <span>Payment method</span>
        <strong>${escapeHtml(paymentMethod)}</strong>
      </div>

      <div>
        <span>Items purchased</span>
        <strong>${totalItems}</strong>
      </div>
    </div>

    <hr />

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Amount</th>
        </tr>
      </thead>

      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <hr />

    <div class="summary">
      <span>Payment</span>
      <strong>${escapeHtml(paymentMethod)}</strong>
    </div>

    <div class="summary">
      <span>Items</span>
      <strong>${totalItems}</strong>
    </div>

    <div class="total">
      <span>Total paid</span>
      <strong>₱${money(totalAmount)}</strong>
    </div>

    <div class="qr">
      <img
        src="${qrDataUrl}"
        alt="Receipt QR code"
      />
      <p>Scan this code to identify the receipt</p>
    </div>

    <footer>
      <strong>Thank you for your purchase!</strong>
      Please keep this receipt for your records.
    </footer>
  </main>
</body>
</html>`;
}

export default function ReceiptPage({
  sale,
  onBack
}) {
  const [downloading, setDownloading] =
    useState(false);

  if (!sale) {
    return null;
  }

  const {
    items,
    totalItems,
    totalAmount,
    receiptNumber,
    dateTime,
    cashierName,
    paymentMethod
  } = getReceiptData(sale);

  function handlePrint() {
    window.print();
  }

  async function handleDownload() {
    if (downloading) {
      return;
    }

    setDownloading(true);

    try {
      const qrDataUrl = await QRCode.toDataURL(
        receiptNumber,
        {
          width: 300,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#172033',
            light: '#ffffff'
          }
        }
      );

      const html = buildReceiptHtml(
        sale,
        qrDataUrl
      );

      const blob = new Blob(
        [html],
        {
          type: 'text/html;charset=utf-8'
        }
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = url;
      link.download = `receipt-${receiptNumber}.html`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error(
        'Unable to download receipt:',
        error
      );

      window.alert(
        'Unable to download the receipt. Please try again or use Print instead.'
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="receipt-overlay">
      <section
        className="receipt-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
      >
        <header className="receipt-dialog-header">
          <div>
            <span className="receipt-kicker">
              TRANSACTION COMPLETE
            </span>

            <h2 id="receipt-title">
              Official receipt
            </h2>
          </div>

          <button
            type="button"
            className="receipt-close"
            onClick={onBack}
            aria-label="Close receipt"
          >
            <X size={19} />
          </button>
        </header>

        <article className="receipt-paper">
          <div className="receipt-store">
            <h1>Essential Supermarket</h1>

            <p>
              Your everyday essentials, made simple.
            </p>
          </div>

          <div className="receipt-number">
            <span>Receipt number</span>

            <strong>{receiptNumber}</strong>
          </div>

          <div className="receipt-meta">
            <div>
              <span>Date and time</span>

              <strong>
                {formatDateTime(dateTime)}
              </strong>
            </div>

            <div>
              <span>Cashier</span>

              <strong>{cashierName}</strong>
            </div>

            <div>
              <span>Payment method</span>

              <strong>{paymentMethod}</strong>
            </div>

            <div>
              <span>Items purchased</span>

              <strong>{totalItems}</strong>
            </div>
          </div>

          <div className="receipt-rule" />

          <table className="receipt-items">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => {
                const quantity = Number(
                  item.quantity || 0
                );

                const unitPrice = Number(
                  item.unitPrice || 0
                );

                const subtotal = getItemSubtotal(
                  item
                );

                return (
                  <tr
                    key={
                      item._id ||
                      `${getItemBarcode(item)}-${index}`
                    }
                  >
                    <td>
                      <strong>
                        {getItemName(item)}
                      </strong>

                      {getItemBarcode(item) && (
                        <small>
                          {getItemBarcode(item)}
                        </small>
                      )}

                      <small>
                        ₱{money(unitPrice)} each
                      </small>
                    </td>

                    <td>{quantity}</td>

                    <td>
                      ₱{money(subtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="receipt-rule" />

          <div className="receipt-summary">
            <div>
              <span>Payment</span>

              <strong>{paymentMethod}</strong>
            </div>

            <div>
              <span>Items</span>

              <strong>{totalItems}</strong>
            </div>
          </div>

          <div className="receipt-total">
            <span>Total paid</span>

            <strong>
              ₱{money(totalAmount)}
            </strong>
          </div>

          <div className="receipt-qr">
            <QRCodeSVG
              value={receiptNumber}
              size={128}
              bgColor="#ffffff"
              fgColor="#172033"
              level="M"
              includeMargin
            />

            <small>
              Scan this code to identify the receipt
            </small>
          </div>

          <footer className="receipt-footer">
            <strong>
              Thank you for your purchase!
            </strong>

            <p>
              Please keep this receipt for your records.
            </p>
          </footer>
        </article>

        <footer className="receipt-actions">
          <button
            type="button"
            className="receipt-button receipt-button-secondary"
            onClick={onBack}
          >
            <ArrowLeft size={17} />
            New sale
          </button>

          <button
            type="button"
            className="receipt-button receipt-button-secondary"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download size={17} />

            {downloading
              ? 'Preparing...'
              : 'Download'}
          </button>

          <button
            type="button"
            className="receipt-button receipt-button-primary"
            onClick={handlePrint}
          >
            <Printer size={17} />
            Print
          </button>
        </footer>

        <style>{`
          @media print {
            @page {
              margin: 8mm;
            }

            body {
              background: #ffffff !important;
            }

            body * {
              visibility: hidden !important;
            }

            .receipt-paper,
            .receipt-paper * {
              visibility: visible !important;
            }

            .receipt-paper {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
            }

            .receipt-overlay {
              position: static !important;
              display: block !important;
              padding: 0 !important;
              background: transparent !important;
            }

            .receipt-dialog {
              width: 100% !important;
              max-height: none !important;
              overflow: visible !important;
              border-radius: 0 !important;
              background: transparent !important;
              box-shadow: none !important;
            }

            .receipt-dialog-header,
            .receipt-actions {
              display: none !important;
            }

            .receipt-number {
              padding-right: 0 !important;
              padding-left: 0 !important;
              background: transparent !important;
            }
          }
        `}</style>
      </section>
    </div>
  );
}