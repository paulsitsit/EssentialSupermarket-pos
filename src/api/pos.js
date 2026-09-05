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
    price: Number(
      product.sellingPrice ??
        product.price ??
        product.costPrice ??
        0
    ),
    barcode: product.barcode || '',
    stock: Number(product.currentStock || 0),
    unitType: product.unitType || 'piece'
  };
}

function normalizeSale(apiData, payload) {
  const rawSale = apiData?.sale || {};

  return {
    ...rawSale,

    _id:
      rawSale._id ||
      rawSale.id ||
      apiData?.saleId ||
      null,

    receiptNumber:
      rawSale.receiptNumber ||
      apiData?.receiptNumber ||
      null,

    items: Array.isArray(rawSale.items)
      ? rawSale.items.map(item => ({
          ...item,
          name: item.name || 'Product',
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
          subtotal: Number(
            item.subtotal ??
              Number(item.quantity || 0) *
                Number(item.unitPrice || 0)
          )
        }))
      : [],

    totalAmount: Number(
      rawSale.totalAmount ??
        apiData?.totalAmount ??
        0
    ),

    paymentMethod:
      rawSale.paymentMethod ||
      payload.paymentMethod ||
      'cash',

    createdAt:
      rawSale.createdAt ||
      apiData?.createdAt ||
      new Date().toISOString(),

    cashier: rawSale.cashier || null
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
      scannedQuantity: Math.max(
        1,
        Number(quantity) || 1
      )
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
 * Expected backend response:
 *
 * {
 *   message: 'Sale completed successfully',
 *   receiptNumber: 'ES-MAIN-20260905-000004',
 *   sale: {
 *     _id: '...',
 *     receiptNumber: 'ES-MAIN-20260905-000004',
 *     items: [...],
 *     totalAmount: 64,
 *     paymentMethod: 'cash',
 *     createdAt: '...'
 *   },
 *   movements: [...]
 * }
 */
export async function checkout(payload) {
  if (
    !payload ||
    !Array.isArray(payload.items) ||
    payload.items.length === 0
  ) {
    return {
      success: false,
      error: 'Cart is empty'
    };
  }

  try {
    const response = await client.post(
      '/sales',
      payload
    );

    const sale = normalizeSale(
      response.data,
      payload
    );

    if (!sale.receiptNumber) {
      return {
        success: false,
        error:
          'Sale completed, but the server did not return a receipt number.'
      };
    }

    if (!sale.items.length) {
      return {
        success: false,
        error:
          'Sale completed, but the server did not return the sold items for the receipt.'
      };
    }

    return {
      success: true,
      sale,
      receiptNumber: sale.receiptNumber,
      movements: response.data?.movements || []
    };
  } catch (error) {
    return {
      success: false,
      error:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Checkout failed'
    };
  }
}