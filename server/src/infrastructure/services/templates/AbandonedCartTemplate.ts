export const getAbandonedCartEmailTemplate = (
  userName: string,
  cartItems: {
    productName: string;
    variantName?: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }[],
  checkoutUrl: string,
  subscriberEmail: string
): string => {
  const apiBaseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const unsubscribeUrl = `${apiBaseUrl}/api/v1/newsletter/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`;
  const itemsHtml = cartItems
    .map(
      (item) => `
    <div style="display: flex; margin-bottom: 20px; align-items: center; border-bottom: 1px solid #eeeeee; padding-bottom: 20px;">
      ${
        item.imageUrl
          ? `<img src="${item.imageUrl}" alt="${item.productName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />`
          : `<div style="width: 80px; height: 80px; background-color: #f5f5f5; border-radius: 8px; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 12px;">Sin Imagen</div>`
      }
      <div style="flex-grow: 1;">
        <h4 style="margin: 0; font-size: 16px; color: #333;">${item.productName}</h4>
        ${item.variantName && item.variantName !== 'Default' ? `<p style="margin: 4px 0 0; font-size: 14px; color: #777;">Variante: ${item.variantName}</p>` : ''}
        <p style="margin: 4px 0 0; font-size: 14px; color: #777;">Cantidad: ${item.quantity}</p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">S/ ${(item.price * item.quantity).toFixed(2)}</p>
      </div>
    </div>
  `
    )
    .join('');

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f9fafb;
          margin: 0;
          padding: 0;
          color: #333333;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          padding: 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 15px;
          color: #1f2937;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          color: #4b5563;
          margin-bottom: 30px;
        }
        .items-container {
          margin-bottom: 30px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 15px;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }
        .cta-container {
          text-align: center;
          margin-top: 40px;
        }
        .cta-button {
          display: inline-block;
          background-color: #2563eb;
          color: #ffffff !important;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          padding: 16px 32px;
          border-radius: 8px;
          transition: background-color 0.2s;
        }
        .cta-button:hover {
          background-color: #1d4ed8;
        }
        .footer {
          background-color: #f3f4f6;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡No olvides tus productos!</h1>
        </div>
        <div class="content">
          <div class="greeting">Hola ${userName},</div>
          <div class="message">
            Notamos que dejaste algunos artículos excelentes en tu carrito de compras en <strong>E-Commerce</strong>. 
            Tus productos aún te están esperando, pero nuestro inventario se mueve rápido. ¡Completa tu compra antes de que se agoten!
          </div>
          
          <div class="items-container">
            ${itemsHtml}
            <div class="total-row">
              <span>Total del carrito:</span>
              <span>S/ ${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="cta-container">
            <a href="${checkoutUrl}" class="cta-button">Completar mi compra</a>
          </div>
        </div>
        <div class="footer">
          <p>Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este correo.</p>
          <p>&copy; ${new Date().getFullYear()} E-Commerce. Todos los derechos reservados.</p>
          <p style="margin-top: 15px; font-size: 12px;"><a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Cancelar suscripción al newsletter</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};
