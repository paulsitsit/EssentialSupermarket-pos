import { useState } from 'react';

import BarcodeScanner from '../components/BarcodeScanner.jsx';
import CartTable from '../components/CartTable.jsx';
import { scanBarcode, checkout } from '../api/pos';

function getAudioContext() {
  const AudioContextClass =
    window.AudioContext ||
    window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  return new AudioContextClass();
}

function playSuccessBeep() {
  try {
    const audioContext = getAudioContext();

    if (!audioContext) {
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';

    oscillator.frequency.setValueAtTime(
      1050,
      audioContext.currentTime
    );

    gainNode.gain.setValueAtTime(
      0.0001,
      audioContext.currentTime
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.16,
      audioContext.currentTime + 0.01
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.12
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.13);

    oscillator.addEventListener('ended', () => {
      audioContext.close();
    });
  } catch {
    // A scan must still work if the device/browser blocks audio.
  }
}

function playErrorBeep() {
  try {
    const audioContext = getAudioContext();

    if (!audioContext) {
      return;
    }

    const gainNode = audioContext.createGain();
    const firstTone = audioContext.createOscillator();
    const secondTone = audioContext.createOscillator();

    gainNode.gain.setValueAtTime(
      0.0001,
      audioContext.currentTime
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.12,
      audioContext.currentTime + 0.01
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.27
    );

    firstTone.type = 'square';
    firstTone.frequency.setValueAtTime(
      260,
      audioContext.currentTime
    );

    secondTone.type = 'square';
    secondTone.frequency.setValueAtTime(
      190,
      audioContext.currentTime + 0.14
    );

    firstTone.connect(gainNode);
    secondTone.connect(gainNode);
    gainNode.connect(audioContext.destination);

    firstTone.start();
    firstTone.stop(audioContext.currentTime + 0.1);

    secondTone.start(audioContext.currentTime + 0.14);
    secondTone.stop(audioContext.currentTime + 0.26);

    secondTone.addEventListener('ended', () => {
      audioContext.close();
    });
  } catch {
    // Keep POS scanning functional if audio is unavailable.
  }
}

export default function PosPage({
  user,
  onLogout,
  onCheckoutSuccess
}) {
  const [cart, setCart] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  function addToCart(product, scannedQty) {
    setCart(previousCart => {
      const existing = previousCart.find(
        item => item.productId === product.id
      );

      if (existing) {
        return previousCart.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + scannedQty
              }
            : item
        );
      }

      return [
        ...previousCart,
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
    if (scanning || checkoutLoading) {
      return;
    }

    setScanning(true);
    setScanError('');

    try {
      const result = await scanBarcode(barcode, 1);

      if (!result.success) {
        playErrorBeep();
        setScanError(
          result.error || 'Product not found'
        );
        return;
      }

      playSuccessBeep();
      addToCart(
        result.product,
        result.scannedQuantity
      );
    } catch (err) {
      const message =
        err?.response?.status === 404
          ? 'Product not found'
          : err?.response?.data?.message ||
            err?.response?.data?.error ||
            'Scan failed';

      playErrorBeep();
      setScanError(message);
    } finally {
      window.setTimeout(() => {
        setScanning(false);
      }, 1200);
    }
  }

  function updateQuantity(productId, quantity) {
    const safeQuantity = Number(quantity);

    if (
      !Number.isFinite(safeQuantity) ||
      safeQuantity <= 0
    ) {
      removeItem(productId);
      return;
    }

    setCart(previousCart =>
      previousCart.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity: safeQuantity
            }
          : item
      )
    );
  }

  function removeItem(productId) {
    setCart(previousCart =>
      previousCart.filter(
        item => item.productId !== productId
      )
    );
  }

  async function handleCheckout() {
    if (cart.length === 0 || checkoutLoading) {
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError('');

    try {
      const items = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price
      }));

      const payload = {
        items,
        paymentMethod: 'cash'
      };

      const result = await checkout(payload);

      if (!result.success) {
        playErrorBeep();
        setCheckoutError(
          result.error || 'Checkout failed'
        );
        return;
      }

      setCart([]);

      onCheckoutSuccess?.({
        sale: result.sale
      });
    } catch (err) {
      playErrorBeep();

      setCheckoutError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Checkout failed'
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  const canCheckout =
    cart.length > 0 &&
    !checkoutLoading;

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
        <h1 style={{ fontSize: 18 }}>
          Cashier POS
        </h1>

        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center'
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: '#555'
            }}
          >
            {user?.name || user?.email}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{
              padding: '6px 10px',
              fontSize: 13
            }}
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>

      <BarcodeScanner
        onScan={handleScan}
        disabled={checkoutLoading || scanning}
      />

      {scanError && (
        <div className="card">
          <div className="error">
            {scanError}
          </div>
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
            {checkoutLoading
              ? 'Processing…'
              : 'PROCEED'}
          </button>

          {!canCheckout && (
            <span
              style={{
                color: '#666',
                fontSize: 14
              }}
            >
              {cart.length === 0
                ? 'Cart is empty'
                : ''}
            </span>
          )}
        </div>
      </div>

      {checkoutError && (
        <div className="card">
          <div className="error">
            {checkoutError}
          </div>
        </div>
      )}
    </div>
  );
}