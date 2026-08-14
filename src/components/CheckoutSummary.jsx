export default function CheckoutSummary({ loading, error, success, onReset }) {
  if (!success && !error) return null;

  return (
    <div className="card">
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>Checkout</h1>

      {loading && <p style={{ color: '#666' }}>Processing sale…</p>}

      {error && (
        <div className="error">
          {typeof error === 'string' ? error : 'Checkout failed'}
        </div>
      )}

      {success && (
        <>
          <div className="success">Sale completed successfully</div>

          <div style={{ marginTop: 12, fontSize: 14 }}>
            <div><strong>Total items:</strong> {success.sale.totalItems}</div>
            <div><strong>Total amount:</strong> ₱{success.sale.totalAmount.toFixed(2)}</div>
            <div><strong>Time:</strong> {new Date(success.sale.timestamp).toLocaleString()}</div>
          </div>

          {success.movements && success.movements.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h2 style={{ fontSize: 16, marginBottom: 6 }}>Inventory movements</h2>
              <ul style={{ paddingLeft: 18, fontSize: 14 }}>
                {success.movements.map((m, i) => (
                  <li key={i}>
                    {m.productName}: sold {m.quantitySold}, remaining {m.remainingStock}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            className="btn"
            style={{ marginTop: 16 }}
            onClick={onReset}
          >
            New sale
          </button>
        </>
      )}
    </div>
  );
}