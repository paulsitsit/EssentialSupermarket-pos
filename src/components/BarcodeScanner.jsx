import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScanner({ onScan, disabled = false }) {
  const scannerRef = useRef(null);
  const startingRef = useRef(false);
  const stoppingRef = useRef(false);
  const mountedRef = useRef(true);
  const onScanRef = useRef(onScan);

  const [started, setStarted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      void stopCamera();
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      void stopCamera();
    }
  }, [disabled]);

  async function startCamera() {
    if (disabled || startingRef.current || scanning || scannerRef.current) {
      return;
    }

    startingRef.current = true;
    stoppingRef.current = false;
    setError('');

    const scanner = new Html5Qrcode('barcode-reader');
    scannerRef.current = scanner;

    try {
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
          // Normal while searching for a barcode.
        }
      );

      if (!mountedRef.current || stoppingRef.current || disabled) {
        await stopScannerInstance(scanner);
        return;
      }

      setStarted(true);
      setScanning(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);

      if (mountedRef.current && !stoppingRef.current) {
        setError(
          'Camera could not start. Allow camera permission and use HTTPS.'
        );
        setStarted(false);
        setScanning(false);
      }

      scannerRef.current = null;
    } finally {
      startingRef.current = false;
    }
  }

  async function stopScannerInstance(scanner) {
    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      const message = String(err?.message || err);

      if (!message.includes('Cannot transition')) {
        console.warn('Error stopping scanner:', err);
      }
    }

    try {
      await scanner.clear();
    } catch (err) {
      console.warn('Error clearing scanner:', err);
    }
  }

  async function stopCamera() {
    if (stoppingRef.current) return;

    stoppingRef.current = true;
    const scanner = scannerRef.current;

    if (!scanner) {
      if (mountedRef.current) {
        setStarted(false);
        setScanning(false);
      }
      stoppingRef.current = false;
      return;
    }

    await stopScannerInstance(scanner);

    if (scannerRef.current === scanner) {
      scannerRef.current = null;
    }

    if (mountedRef.current) {
      setStarted(false);
      setScanning(false);
    }

    stoppingRef.current = false;
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
          disabled={disabled || startingRef.current}
        >
          {startingRef.current ? 'Starting camera…' : 'Start camera'}
        </button>
      )}

      {started && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void stopCamera()}
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
          Point your camera at a barcode or QR code.
        </div>
      )}

      {error && (
        <div className="error" style={{ marginTop: 10 }} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}