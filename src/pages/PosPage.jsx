import { useState } from 'react';
import BarcodeScanner from '../components/BarcodeScanner.jsx';
import CartTable from '../components/CartTable.jsx';
import { scanBarcode, checkout } from '../api/pos';

export default function PosPage({ user, onLogout, onCheckoutSuccess }) {
  const [cart, setCart] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  function addToCart(product, scannedQty) {
    setCart((prev) => {
      const existing = prev.find((p) => p.productId === product.id);

      if (existing) {
        return prev.map((p) =>
          p.productId === product.id
            ? { ...p, quantity: p.quantity + scannedQty }
            : p
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          price: product.price,
          quantity: scannedQty
        }
      ];
    });
  }

  async function handleScan(barcode) {
    // Keep camera open, but ignore repeated detections briefly.
    if (scanning || checkoutLoading) return;

    setScanning(true);
    setScanError('');

    try {
      const res = await scanBarcode(barcode, 1);

      if (!res.success) {
        setScanError(res.error || 'Product not found');
        return;
      }

      addToCart(res.product, res.scannedQuantity);
    } catch (err) {
      const msg =
        err?.response?.status === 404
          ? 'Product not found'
          : err?.response?.data?.error || 'Scan failed';

      setScanError(msg);
    } finally {
      // Camera stays active; this only prevents duplicate readings.
      window.setTimeout(() => {
        setScanning(false);
      }, 1200);
    }
  }

  function updateQuantity(productId, quantity) {
    const safeQuantity = Number(quantity);

    if (!Number.isFinite(safeQuantity) || safeQuantity <= 0) {
      removeItem(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: safeQuantity }
          : item
      )
    );
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  async function handleCheckout() {
    if (cart.length === 0 || checkoutLoading) return;

    setCheckoutLoading(true);
    setCheckoutError('');

    try {
      const res = await checkout(cart, 'Main Branch');

      if (!res.success) {
        setCheckoutError(res.error || 'Checkout failed');
        return;
      }

      setCart([]);

      onCheckoutSuccess?.({
        sale: res.sale,
        movements: res.movements
      });
    } catch (err) {
      setCheckoutError(
        err?.response?.data?.error || 'Checkout failed'
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  const canCheckout = cart.length > 0 && !checkoutLoading;

  return (
    <div className="container">
      <div
        className="card"
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h1 style={{ fontSize: 18 }}>Cashier POS</h1>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: '#555' }}>
            {user?.name || user?.email}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: 13 }}
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Camera stays on after scanning. It closes only during checkout or from Stop camera. */}
      <BarcodeScanner
        onScan={handleScan}
        disabled={checkoutLoading}
      />

      {scanError && (
        <div className="card">
          <div className="error">{scanError}</div>
        </div>
      )}

      <CartTable
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeItem}
      />

      <div className="card">
        <div className="row">
          <button
            type="button"
            className="btn"
            disabled={!canCheckout}
            onClick={handleCheckout}
          >
            {checkoutLoading ? 'Processing…' : 'PROCEED'}
          </button>

          {!canCheckout && (
            <span style={{ color: '#666', fontSize: 14 }}>
              {cart.length === 0 ? 'Cart is empty' : ''}
            </span>
          )}
        </div>
      </div>

      {checkoutError && (
        <div className="card">
          <div className="error">{checkoutError}</div>
        </div>
      )}
    </div>
  );
}