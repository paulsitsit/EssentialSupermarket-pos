import { useState } from 'react';

export default function BarcodeInput({ onScan, disabled }) {
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const clean = (barcode || '').trim();
    if (!clean) {
      setError('Barcode is required');
      return;
    }

    try {
      await onScan(clean);
      setBarcode('');
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Scan failed';
      setError(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Scan product</h1>

      <div className="row">
        <input
          className="input"
          type="text"
          placeholder="Scan or type barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          disabled={disabled}
          autoFocus
        />
        <button className="btn" type="submit" disabled={disabled}>
          Add
        </button>
      </div>

      {error && <div className="error">{error}</div>}
    </form>
  );
}