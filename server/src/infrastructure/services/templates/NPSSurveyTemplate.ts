export const getNPSSurveyTemplate = (
  userName: string,
  surveyUrl: string,
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
        .cta-container {
          margin-top: 20px;
        }
        .cta-button {
          display: inline-block;
          background-color: #10b981;
          color: #ffffff !important;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          padding: 16px 32px;
          border-radius: 8px;
          transition: background-color 0.2s;
        }
        .cta-button:hover {
          background-color: #059669;
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
          <h1>¿Qué tal fue tu experiencia? ⭐</h1>
        </div>
        <div class="content">
          <div class="greeting">¡Hola ${userName}!</div>
          <div class="message">
            Hace poco recibiste tu pedido de <strong>D'Mendoza</strong>. 
            Nos encantaría saber qué tan probable es que nos recomiendes a un amigo o familiar.
            <br><br>
            Tu opinión es muy importante para ayudarnos a mejorar nuestros servicios.
          </div>
          
          <div class="cta-container">
            <a href="${surveyUrl}" class="cta-button">Calificar mi experiencia</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} D'Mendoza. Todos los derechos reservados.</p>
          <p style="margin-top: 15px; font-size: 12px;"><a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Cancelar suscripción al newsletter</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};
