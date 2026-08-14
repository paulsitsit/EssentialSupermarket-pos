import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function BarcodeScanner({ onScan, disabled }) {
  const containerRef = useRef(null);
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (disabled || !containerRef.current || initialized) return;

    try {
      const scanner = new Html5QrcodeScanner(
        'barcode-scanner-container',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          useBarCodeDetectorIfSupported: true
        },
        false // showLessUI = false
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          // Success: a barcode/QR was scanned
          onScan?.(decodedText);
        },
        (errorMessage) => {
          // Scan errors are normal; ignore or log if needed
          // console.log('Scan error:', errorMessage);
        }
      );

      setInitialized(true);
    } catch (err) {
      console.error('Failed to init scanner:', err);
      setError('Camera access failed. Make sure you allow camera permission and use HTTPS.');
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {}
      }
    };
  }, [disabled, initialized, onScan]);

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>
        Scan barcode / QR code
      </div>

      {error && (
        <div style={{ marginBottom: 8, color: '#b00020', fontSize: 14 }}>
          {error}
        </div>
      )}

      <div
        id="barcode-scanner-container"
        ref={containerRef}
        style={{
          width: '100%',
          maxWidth: 400,
          margin: '0 auto'
        }}
      />

      {!initialized && !error && (
        <div style={{ marginTop: 8, fontSize: 13, color: '#555' }}>
          Initializing camera…
        </div>
      )}
    </div>
  );
}