import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScanner({ onScan, disabled = false }) {
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const [started, setStarted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (disabled) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [disabled]);

  async function startCamera() {
    if (disabled || scanning) return;

    setError('');

    try {
      const scanner = new Html5Qrcode('barcode-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777778
        },
        (decodedText) => {
          onScanRef.current?.(decodedText);
        },
        () => {
          // Normal while the camera searches for a code.
        }
      );

      setStarted(true);
      setScanning(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError(
        'Camera could not start. Allow camera permission and open this page using HTTPS.'
      );
      setStarted(false);
      setScanning(false);
      scannerRef.current = null;
    }
  }

  async function stopCamera() {
    const scanner = scannerRef.current;

    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      await scanner.clear();
    } catch (err) {
      console.warn('Error stopping scanner:', err);
    } finally {
      scannerRef.current = null;
      setStarted(false);
      setScanning(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 12, fontWeight: 600 }}>
        Scan barcode / QR code
      </div>

      {!started && (
        <button
          type="button"
          className="btn"
          onClick={startCamera}
          disabled={disabled}
        >
          Start camera
        </button>
      )}

      {started && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={stopCamera}
          disabled={disabled}
          style={{ marginBottom: 12 }}
        >
          Stop camera
        </button>
      )}

      <div
        id="barcode-reader"
        style={{
          width: '100%',
          maxWidth: 420,
          margin: '0 auto',
          overflow: 'hidden',
          borderRadius: 8
        }}
      />

      {started && scanning && (
        <div style={{ marginTop: 8, fontSize: 13, color: '#555' }}>
          Point your phone camera at a barcode or QR code.
        </div>
      )}

      {error && (
        <div
          className="error"
          style={{ marginTop: 10 }}
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}