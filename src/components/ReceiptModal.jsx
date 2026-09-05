import { useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import '../receipt-modal.css';

function formatPeso(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(Number(value || 0));
}

function formatDate(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default function ReceiptModal({
  sale,
  receiptNumber,
  onClose
}) {
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, [onClose]);

  if (!sale || !receiptNumber) {
    return null;
  }

  const items = Array.isArray(sale.items)
    ? sale.items
    : [];

  const totalItems = items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  const cashierName =
    sale.cashier?.fullName ||
    sale.cashier?.name ||
    'Cashier';

  const paymentMethod = String(
    sale.paymentMethod || 'cash'
  ).toUpperCase();

  const qrValue = JSON.stringify({
    receiptNumber,
    saleId: sale._id,
    totalAmount: sale.totalAmount
  });

  function handlePrint() {
    const popup = window.open(
      '',
      '_blank',
      'width=420,height=760'
    );

    if (!popup) {
      window.alert(
        'The browser blocked the print window. Please allow popups for this POS site, then try again.'
      );
      return;
    }

    const printableRows = items
      .map(
        item => `
          <tr>
            <td>${escapeHtml(item.name || 'Product')}</td>
            <td class="center">${Number(item.quantity || 0)}</td>
            <td class="right">${formatPeso(item.subtotal)}</td>
          </tr>
        `
      )
      .join('');

    const qrImageUrl =
      document.querySelector(
        '.receipt-qr svg'
      )?.outerHTML || '';

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt ${escapeHtml(receiptNumber)}</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              width: 300px;
              margin: 0 auto;
              padding: 18px 12px;
              color: #111827;
              font-family: "Courier New", monospace;
              font-size: 12px;
            }

            .centered {
              text-align: center;
            }

            .logo {
              display: inline-flex;
              width: 42px;
              height: 42px;
              align-items: center;
              justify-content: center;
              margin-bottom: 8px;
              border-radius: 12px;
              background: #15803d;
              color: white;
              font-family: Arial, sans-serif;
              font-size: 15px;
              font-weight: 800;
            }

            h1 {
              margin: 0;
              font-family: Arial, sans-serif;
              font-size: 17px;
            }

            .branch {
              margin: 4px 0 18px;
              color: #4b5563;
              font-family: Arial, sans-serif;
              font-size: 11px;
            }

            .receipt-number {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              margin-bottom: 14px;
              padding: 9px;
              background: #f0fdf4;
              color: #166534;
              font-size: 11px;
            }

            .receipt-number strong {
              overflow-wrap: anywhere;
              text-align: right;
            }

            .meta p,
            .summary p {
              margin: 4px 0;
            }

            .rule {
              margin: 15px 0;
              border-top: 1px dashed #64748b;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }

            th {
              padding-bottom: 7px;
              border-bottom: 1px solid #9ca3af;
              color: #4b5563;
              font-size: 10px;
              text-align: left;
              text-transform: uppercase;
            }

            td {
              padding: 8px 0;
              vertical-align: top;
              overflow-wrap: anywhere;
            }

            th:first-child,
            td:first-child {
              width: 58%;
            }

            th:nth-child(2),
            td:nth-child(2) {
              width: 14%;
            }

            th:nth-child(3),
            td:nth-child(3) {
              width: 28%;
            }

            .center {
              text-align: center;
            }

            .right {
              text-align: right;
            }

            .total {
              display: flex;
              justify-content: space-between;
              margin-top: 15px;
              padding-top: 12px;
              border-top: 2px solid #111827;
              font-family: Arial, sans-serif;
              font-size: 17px;
              font-weight: 800;
            }

            .total strong {
              color: #15803d;
            }

            .qr {
              margin: 20px auto 8px;
              text-align: center;
            }

            .qr svg {
              width: 128px;
              height: 128px;
            }

            .qr small {
              display: block;
              margin-top: 8px;
              color: #4b5563;
              font-family: Arial, sans-serif;
              font-size: 9px;
              overflow-wrap: anywhere;
            }

            .footer {
              margin-top: 18px;
              color: #4b5563;
              font-family: Arial, sans-serif;
              font-size: 10px;
              text-align: center;
            }

            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>

        <body>
          <div class="centered">
            <div class="logo">ES</div>
            <h1>Essential Supermarket</h1>
            <p class="branch">Main Branch</p>
          </div>

          <div class="receipt-number">
            <span>Receipt No.</span>
            <strong>${escapeHtml(receiptNumber)}</strong>
          </div>

          <div class="meta">
            <p><strong>Date:</strong> ${escapeHtml(formatDate(sale.createdAt))}</p>
            <p><strong>Cashier:</strong> ${escapeHtml(cashierName)}</p>
          </div>

          <div class="rule"></div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th class="center">Qty</th>
                <th class="right">Total</th>
              </tr>
            </thead>

            <tbody>
              ${printableRows}
            </tbody>
          </table>

          <div class="rule"></div>

          <div class="summary">
            <p><strong>Items:</strong> ${totalItems}</p>
            <p><strong>Payment:</strong> ${escapeHtml(paymentMethod)}</p>
          </div>

          <div class="total">
            <span>TOTAL</span>
            <strong>${formatPeso(sale.totalAmount)}</strong>
          </div>

          <div class="qr">
            ${qrImageUrl}
            <small>Scan for return lookup</small>
          </div>

          <div class="footer">
            <p><strong>Thank you for shopping with us.</strong></p>
            <p>Keep this receipt for returns or exchanges.</p>
          </div>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    popup.document.close();
  }

  return (
    <div
      className="receipt-overlay"
      onMouseDown={onClose}
    >
      <section
        className="receipt-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        onMouseDown={event =>
          event.stopPropagation()
        }
      >
        <header className="receipt-dialog-header">
          <div>
            <span className="receipt-kicker">
              SALE COMPLETED
            </span>

            <h2 id="receipt-title">
              Receipt
            </h2>
          </div>

          <button
            type="button"
            className="receipt-close"
            onClick={onClose}
            aria-label="Close receipt"
          >
            <X size={20} />
          </button>
        </header>

        <div className="receipt-paper">
          <div className="receipt-store">
            <div className="receipt-store-mark">
              ES
            </div>

            <h1>Essential Supermarket</h1>
            <p>Main Branch</p>
          </div>

          <div className="receipt-number">
            <span>Receipt No.</span>
            <strong>{receiptNumber}</strong>
          </div>

          <div className="receipt-meta">
            <div>
              <span>Date</span>
              <strong>
                {formatDate(sale.createdAt)}
              </strong>
            </div>

            <div>
              <span>Cashier</span>
              <strong>{cashierName}</strong>
            </div>
          </div>

          <div className="receipt-rule" />

          <table className="receipt-items">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr
                  key={`${item.product || item.name}-${index}`}
                >
                  <td>
                    {item.name || 'Product'}
                  </td>

                  <td>
                    {Number(item.quantity || 0)}
                  </td>

                  <td>
                    {formatPeso(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-rule" />

          <div className="receipt-summary">
            <div>
              <span>Items</span>
              <strong>{totalItems}</strong>
            </div>

            <div>
              <span>Payment</span>
              <strong>{paymentMethod}</strong>
            </div>
          </div>

          <div className="receipt-total">
            <span>TOTAL</span>
            <strong>
              {formatPeso(sale.totalAmount)}
            </strong>
          </div>

          <div className="receipt-qr">
            <QRCodeSVG
              value={qrValue}
              size={128}
              level="M"
              includeMargin
              bgColor="#ffffff"
              fgColor="#111827"
            />

            <small>
              Scan for return lookup
            </small>
          </div>

          <footer className="receipt-footer">
            <strong>
              Thank you for shopping with us.
            </strong>

            <p>
              Keep this receipt for returns or exchanges.
            </p>
          </footer>
        </div>

        <footer className="receipt-actions">
          <button
            type="button"
            className="receipt-button receipt-button-secondary"
            onClick={handlePrint}
          >
            <Printer size={17} />
            Print receipt
          </button>

          <button
            type="button"
            className="receipt-button receipt-button-primary"
            onClick={onClose}
          >
            Done
          </button>
        </footer>
      </section>
    </div>
  );
}