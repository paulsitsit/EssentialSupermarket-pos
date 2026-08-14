export default function CartTable({ cart, onUpdateQuantity, onRemove }) {
  if (!cart || cart.length === 0) {
    return (
      <div className="card">
        <h1 style={{ fontSize: 18, marginBottom: 8 }}>Cart</h1>
        <p style={{ color: '#666', fontSize: 14 }}>No items yet. Scan a product to add to cart.</p>
      </div>
    );
  }

  let totalItems = 0;
  let totalAmount = 0;

  for (const item of cart) {
    totalItems += item.quantity;
    totalAmount += item.quantity * item.price;
  }

  return (
    <div className="card">
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Cart</h1>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Brand</th>
            <th>Category</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item) => (
            <tr key={item.productId}>
              <td>{item.name}</td>
              <td>{item.brand || '-'}</td>
              <td>{item.category || '-'}</td>
              <td>₱{item.price.toFixed(2)}</td>
              <td>
                <input
                  type="number"
                  min="1"
                  style={{ width: 60 }}
                  value={item.quantity}
                  onChange={(e) => {
                    const q = Math.max(1, Number(e.target.value) || 1);
                    onUpdateQuantity(item.productId, q);
                  }}
                />
              </td>
              <td>₱{(item.quantity * item.price).toFixed(2)}</td>
              <td>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: 12 }}
                  onClick={() => onRemove(item.productId)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
          <tr className="total-row">
            <td colSpan={4}>Total</td>
            <td>{totalItems}</td>
            <td colSpan={2}>₱{totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}