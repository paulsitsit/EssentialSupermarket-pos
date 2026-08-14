import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScanner({ onScan, disabled }) {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (disabled) {
      stopScanner();
      return;
    }

    if (started) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [disabled, started]);

  async function startScanner() {
    if (!scannerRef.current || scanning) return;

    try {
      const html5QrCode = new Html5Qrcode('barcode-scanner-container');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.render(
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        {
          facingMode: 'environment'
        }
      );

      setScanning(true);
      setError('');

      html5QrCode.start(
        { facingMode: 'environment' },
        {
          qrboxFunction: function (success) {
            onScan?.(success);
          }
        },
        (error) => {
          // ignore frequent scan errors
        }
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Camera access failed. Make sure you allow camera permission and use HTTPS.');
      setScanning(false);
    }
  }

  function stopScanner() {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().catch(console.error);
    }
    setScanning(false);
  }

  function handleStart() {
    setStarted(true);
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>
        Scan barcode / QR code
      </div>

      {!started ? (
        <div>
          <button className="btn" onClick={handleStart} disabled={disabled}>
            Start camera
          </button>
          <div style={{ marginTop: 8, fontSize: 13, color: '#555' }}>
            Click to allow camera access. Use HTTPS.
          </div>
        </div>
      ) : (
        <>
          <div
            id="barcode-scanner-container"
            ref={scannerRef}
            style={{
              width: '100%',
              maxWidth: 400,
              margin: '0 auto',
              background: '#000',
              borderRadius: 8,
              overflow: 'hidden'
            }}
          />

          {error && (
            <div style={{ marginTop: 8, color: '#b00020', fontSize: 14 }}>
              {error}
            </div>
          )}

          {!disabled && !scanning && !error && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#555' }}>
              Starting camera…
            </div>
          )}
        </>
      )}
    </div>
  );
}