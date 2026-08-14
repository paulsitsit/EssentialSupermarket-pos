import { useEffect } from 'react';

export default function ReceiptPage({ sale, onBack }) {
  useEffect(() => {
    // Auto-open print dialog on mount
    const timer = setTimeout(() => {
      window.print();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  if (!sale) return null;

  return (
    <div className="container">
      <div
        className="card"
        style={{
          maxWidth: 420,
          margin: '24px auto',
          // Print-friendly styles
          border: '1px solid #ddd'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <h1 style={{ fontSize: 18, marginBottom: 4 }}>Essential Supermarket</h1>
          <div style={{ fontSize: 13, color: '#555' }}>Official Receipt</div>
        </div>

        <div style={{ fontSize: 13, marginBottom: 12 }}>
          <div><strong>Date:</strong> {new Date(sale.timestamp).toLocaleString()}</div>
          <div><strong>Items:</strong> {sale.totalItems}</div>
          <div><strong>Total:</strong> ₱{sale.totalAmount.toFixed(2)}</div>
        </div>

        {sale.movements && sale.movements.length > 0 && (
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Items sold</div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {sale.movements.map((m, i) => (
                <li key={i}>
                  {m.productName} — {m.quantitySold} × (rem. {m.remainingStock})
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          style={{
            marginTop: 20,
            fontSize: 12,
            color: '#666',
            textAlign: 'center',
            borderTop: '1px solid #eee',
            paddingTop: 8
          }}
        >
          Thank you for your purchase!
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button className="btn btn-secondary" onClick={onBack}>
            Back to POS
          </button>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body {
            background: #fff;
          }
          .container {
            padding: 0;
          }
          .card {
            box-shadow: none;
            border: none;
          }
          button {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}