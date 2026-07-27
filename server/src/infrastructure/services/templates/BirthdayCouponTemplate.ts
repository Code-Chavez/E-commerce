export const getBirthdayCouponTemplate = (
  userName: string,
  couponCode: string,
  storeUrl: string,
  subscriberEmail: string
): string => {
  const apiBaseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const unsubscribeUrl = `${apiBaseUrl}/api/v1/newsletter/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`;
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
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          padding: 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 700;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .greeting {
          font-size: 22px;
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
        .coupon-box {
          background-color: #fef3c7;
          border: 2px dashed #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 0 auto 30px auto;
          max-width: 300px;
        }
        .coupon-title {
          font-size: 14px;
          color: #d97706;
          text-transform: uppercase;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .coupon-code {
          font-size: 28px;
          font-weight: 800;
          color: #1f2937;
          letter-spacing: 2px;
        }
        .cta-container {
          margin-top: 20px;
        }
        .cta-button {
          display: inline-block;
          background-color: #f59e0b;
          color: #ffffff !important;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          padding: 16px 32px;
          border-radius: 8px;
          transition: background-color 0.2s;
        }
        .cta-button:hover {
          background-color: #d97706;
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
          <h1>¡Feliz Cumpleaños! 🎉</h1>
        </div>
        <div class="content">
          <div class="greeting">¡Hola ${userName}!</div>
          <div class="message">
            En <strong>E-Commerce</strong> queremos celebrar contigo este día tan especial. 
            Como regalo de cumpleaños, te obsequiamos un cupón con un <strong>15% de descuento</strong> en toda tu próxima compra.
            ¡Aprovéchalo antes de que expire en 7 días!
          </div>
          
          <div class="coupon-box">
            <div class="coupon-title">Tu código de descuento</div>
            <div class="coupon-code">${couponCode}</div>
          </div>
          
          <div class="cta-container">
            <a href="${storeUrl}" class="cta-button">¡Ir a la tienda!</a>
          </div>
        </div>
        <div class="footer">
          <p>Condiciones: El cupón es válido para un único uso y expira en 7 días a partir de hoy.</p>
          <p>&copy; ${new Date().getFullYear()} E-Commerce. Todos los derechos reservados.</p>
          <p style="margin-top: 15px; font-size: 12px;"><a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Cancelar suscripción al newsletter</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};
