import { useEffect } from 'react';
import {
  ArrowLeft,
  Printer,
  X
} from 'lucide-react';

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

export default function ReceiptPage({
  sale,
  onBack
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.print();
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  if (!sale) {
    return null;
  }

  const items = Array.isArray(sale.items)
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
    sale.totalAmount ?? calculatedTotal
  );

  const receiptNumber =
    sale.receiptNumber ||
    sale.reference ||
    '—';

  const dateTime =
    sale.createdAt ||
    sale.timestamp ||
    sale.date;

  const cashierName =
    sale.cashier?.fullName ||
    sale.cashier?.name ||
    sale.cashierName ||
    'Cashier';

  function handlePrint() {
    window.print();
  }

  function handleBack() {
    onBack?.();
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
            onClick={handleBack}
            aria-label="Close receipt and return to POS"
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

              <strong>
                {readablePaymentMethod(
                  sale.paymentMethod
                )}
              </strong>
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

                const subtotal = getItemSubtotal(item);

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

              <strong>
                {readablePaymentMethod(
                  sale.paymentMethod
                )}
              </strong>
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
            onClick={handleBack}
          >
            <ArrowLeft size={17} />
            New sale
          </button>

          <button
            type="button"
            className="receipt-button receipt-button-primary"
            onClick={handlePrint}
          >
            <Printer size={17} />
            Print receipt
          </button>
        </footer>
      </section>

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
            background: transparent !important;
            padding-right: 0 !important;
            padding-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}