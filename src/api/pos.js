import client from './client';

/**
 * Scan barcode
 * POST /api/pos/scan
 * Body: { barcode: string, quantity?: number }
 */
export async function scanBarcode(barcode, quantity = 1) {
  const res = await client.post('/pos/scan', { barcode, quantity });
  return res.data;
}

/**
 * Checkout
 * POST /api/pos/checkout
 * Body: { cart: [...], branch?: string }
 */
export async function checkout(cart, branch = 'Main Branch') {
  const res = await client.post('/pos/checkout', { cart, branch });
  return res.data;
}