import { useRef, useState } from 'react';
import ReceiptModal from '../components/ReceiptModal.jsx';
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

function closeAudioContext(audioContext) {
  window.setTimeout(() => {
    if (
      audioContext &&
      audioContext.state !== 'closed'
    ) {
      audioContext.close().catch(() => {});
    }
  }, 400);
}

function playSuccessBeep() {
  try {
    const audioContext = getAudioContext();

    if (!audioContext) {
      return;
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = 'square';

    oscillator.frequency.setValueAtTime(
      1800,
      now
    );

    gainNode.gain.setValueAtTime(
      0.0001,
      now
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.28,
      now + 0.003
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.09
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.095);

    oscillator.addEventListener('ended', () => {
      closeAudioContext(audioContext);
    });
  } catch {
    // Do not interrupt the POS workflow if browser sound is unavailable.
  }
}

function playErrorBeep() {
  try {
    const audioContext = getAudioContext();

    if (!audioContext) {
      return;
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    const gainNode = audioContext.createGain();
    const firstTone = audioContext.createOscillator();
    const secondTone = audioContext.createOscillator();
    const now = audioContext.currentTime;

    gainNode.gain.setValueAtTime(
      0.0001,
      now
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.14,
      now + 0.005
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.28
    );

    firstTone.type = 'square';
    firstTone.frequency.setValueAtTime(
      350,
      now
    );

    secondTone.type = 'square';
    secondTone.frequency.setValueAtTime(
      230,
      now + 0.14
    );

    firstTone.connect(gainNode);
    secondTone.connect(gainNode);
    gainNode.connect(audioContext.destination);

    firstTone.start(now);
    firstTone.stop(now + 0.1);

    secondTone.start(now + 0.14);
    secondTone.stop(now + 0.25);

    secondTone.addEventListener('ended', () => {
      closeAudioContext(audioContext);
    });
  } catch {
    // Do not interrupt the POS workflow if browser sound is unavailable.
  }
}

export default function PosPage({
  user,
  onLogout,
  onCheckoutSuccess
}) {
  const [cart, setCart] = useState([]);
  const scanningRef = useRef(false);

  const [scanError, setScanError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [lastSale, setLastSale] = useState(null);

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
                quantity:
                  Number(item.quantity) +
                  Number(scannedQty)
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
          price: Number(product.price || 0),
          quantity: Number(scannedQty || 1)
        }
      ];
    });
  }

  async function handleScan(barcode) {
    if (
      scanningRef.current ||
      checkoutLoading ||
      lastSale
    ) {
      return;
    }

    scanningRef.current = true;
    setScanError('');

    try {
      const result = await scanBarcode(barcode, 1);

      if (!result?.success) {
        playErrorBeep();

        setScanError(
          result?.error || 'Product not found'
        );

        return;
      }

      playSuccessBeep();

      addToCart(
        result.product,
        result.scannedQuantity || 1
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
        scanningRef.current = false;
      }, 700);
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
    if (
      cart.length === 0 ||
      checkoutLoading ||
      lastSale
    ) {
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError('');

    try {
      const items = cart.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.price)
      }));

      const result = await checkout({
        items,
        paymentMethod: 'cash'
      });

      if (!result?.success || !result?.sale) {
        playErrorBeep();

        setCheckoutError(
          result?.error || 'Checkout failed'
        );

        return;
      }

      const sale = result.sale;

      if (!sale.receiptNumber) {
        playErrorBeep();

        setCheckoutError(
          'The sale was completed, but the server did not return a receipt number. Please contact the administrator before processing another sale.'
        );

        return;
      }

      const completedSale = {
        ...sale,
        createdAt:
          sale.createdAt || new Date().toISOString(),
        cashier: sale.cashier || {
          fullName:
            user?.name ||
            user?.fullName ||
            user?.email ||
            'Cashier'
        }
      };

      setCart([]);

      setLastSale(completedSale);

      onCheckoutSuccess?.({
        sale: completedSale,
        receiptNumber: completedSale.receiptNumber
      });

      playSuccessBeep();
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
    !checkoutLoading &&
    !lastSale;

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
            {user?.name ||
              user?.fullName ||
              user?.email ||
              'Cashier'}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{
              padding: '6px 10px',
              fontSize: 13
            }}
            onClick={onLogout}
            disabled={checkoutLoading}
          >
            Logout
          </button>
        </div>
      </div>

      {lastSale && (
        <ReceiptModal
          sale={lastSale}
          receiptNumber={lastSale.receiptNumber}
          onClose={() => {
            setLastSale(null);
            setScanError('');
            setCheckoutError('');
          }}
        />
      )}

      <BarcodeScanner
        onScan={handleScan}
        disabled={checkoutLoading || Boolean(lastSale)}
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
              {lastSale
                ? 'Close the receipt to begin a new sale'
                : cart.length === 0
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
