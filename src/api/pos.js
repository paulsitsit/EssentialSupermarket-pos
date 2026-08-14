import client from './client.js';

function normalizeProduct(product) {
  return {
    id: product._id || product.id,
    name: product.name || 'Unnamed product',
    brand: product.brand || '',
    category:
      typeof product.category === 'object'
        ? product.category?.name || ''
        : product.category || '',
    price: Number(product.costPrice || 0),
    barcode: product.barcode || '',
    stock: Number(product.currentStock || 0),
    unitType: product.unitType || 'piece'
  };
}

export async function scanBarcode(barcode, quantity = 1) {
  const code = String(barcode || '').trim();

  if (!code) {
    return {
      success: false,
      error: 'A barcode or QR code is required'
    };
  }

  try {
    const response = await client.get(
      `/products/scan/${encodeURIComponent(code)}`
    );

    const product = normalizeProduct(response.data);

    if (product.stock <= 0) {
      return {
        success: false,
        error: `${product.name} is out of stock`
      };
    }

    return {
      success: true,
      product,
      scannedQuantity: Math.max(1, Number(quantity) || 1)
    };
  } catch (error) {
    return {
      success: false,
      error:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Product not found'
    };
  }
}

/*
  Checkout is not implemented in the backend files you pasted.

  This placeholder prevents a false `/api/pos/checkout` 404.
  To make checkout subtract stock and save a sale/receipt, the backend needs
  a Sale model and a POST endpoint, for example POST /api/pos/checkout.
*/
export async function checkout() {
  return {
    success: false,
    error:
      'Checkout has not been added to the backend yet. Product scanning is ready.'
  };
}