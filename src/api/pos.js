import client from './client.js';

function normalizeProduct(product) {
  const price = Number(
    product?.sellingPrice ??
      product?.price ??
      0
  );

  return {
    id: product?._id || product?.id,
    name: product?.name || 'Unnamed product',
    brand: product?.brand || '',
    category:
      typeof product?.category === 'object'
        ? product.category?.name || ''
        : product?.category || '',
    price: Number.isFinite(price)
      ? price
      : 0,
    barcode: product?.barcode || '',
    stock: Number(product?.currentStock || 0),
    unitType: product?.unitType || 'piece'
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
          name:
            item.name ||
            item.product?.name ||
            'Product',
          barcode:
            item.barcode ||
            item.product?.barcode ||
            '',
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
      payload?.paymentMethod ||
      'cash',

    createdAt:
      rawSale.createdAt ||
      apiData?.createdAt ||
      new Date().toISOString(),

    cashier: rawSale.cashier || null
  };
}

export async function scanBarcode(
  barcode,
  quantity = 1
) {
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

    const product = normalizeProduct(
      response.data
    );

    if (!product.id) {
      return {
        success: false,
        error:
          'The scanned product is missing a valid product ID.'
      };
    }

    if (
      !Number.isFinite(product.price) ||
      product.price <= 0
    ) {
      return {
        success: false,
        error: `${product.name} does not have a valid selling price. Ask an Admin or Manager to update the product price in the Inventory System.`
      };
    }

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

  /*
   * Send only the IDs and requested quantities.
   * The backend retrieves the trusted retail price
   * from the Product document.
   */
  const cleanPayload = {
    paymentMethod:
      payload.paymentMethod || 'cash',
    items: payload.items.map(item => ({
      productId: item.productId,
      quantity: Number(item.quantity)
    }))
  };

  try {
    const response = await client.post(
      '/sales',
      cleanPayload
    );

    const sale = normalizeSale(
      response.data,
      cleanPayload
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

    if (
      !Number.isFinite(sale.totalAmount) ||
      sale.totalAmount <= 0
    ) {
      return {
        success: false,
        error:
          'Sale completed, but the server returned an invalid total. Please contact an Admin or Manager.'
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