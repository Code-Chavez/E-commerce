/**
 * Templates HTML para los correos del flujo de entregas fallidas (reenvío / devolución).
 * Siguen el mismo estilo visual del email de confirmación de pago con PIN.
 */

const clientUrl = () => process.env.CORS_ORIGIN ?? 'http://localhost:5173';

const wrapper = (content: string) => `
<!DOCTYPE html>
<html lang="es">
  <head><meta charset="UTF-8" /></head>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 24px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e0e0e0;">
      ${content}
      <p style="color: #888; font-size: 12px; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 32px; text-align: center;">
        Este es un correo automático enviado por E-Commerce S.A.C. Por favor no respondas a este mensaje.
      </p>
    </div>
  </body>
</html>`;

export interface FailedDeliveryEmailParams {
  userName: string;
  orderId: number;
  reason: string;
  attemptNumber: number;
  rescheduledFor?: Date | null;
}

/** Email 3.1 — Intento fallido: el cliente debe decidir entre reenvío o devolución. */
export function buildFailedDeliveryDecisionEmail(
  params: FailedDeliveryEmailParams
): { subject: string; html: string } {
  const { userName, orderId, reason, attemptNumber } = params;
  const base = clientUrl();
  const redeliveryUrl = `${base}/profile/orders?orderId=${orderId}&action=redelivery`;
  const returnUrl = `${base}/profile/orders?orderId=${orderId}&action=return`;

  const html = wrapper(`
      <h2 style="color: #3f3f3f; margin-top: 0;">Hola ${userName}, no pudimos entregar tu pedido</h2>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Nuestro repartidor intentó entregar tu pedido <strong>#${orderId}</strong>
        (intento N° ${attemptNumber}) pero no fue posible completar la entrega.
      </p>
      <div style="background-color: #fdf3f3; border-radius: 8px; padding: 16px 20px; margin: 20px 0; border-left: 4px solid #d9534f;">
        <span style="color: #a94442; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 6px;">Motivo registrado</span>
        <strong style="color: #3f3f3f; font-size: 14px;">${reason}</strong>
      </div>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Necesitamos que nos indiques cómo deseas proceder:
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; margin: 24px 0;">
        <tr>
          <td style="padding-right: 8px; width: 50%;">
            <a href="${redeliveryUrl}" style="display: block; text-align: center; background-color: #3f3f3f; color: #ffffff; text-decoration: none; padding: 14px 12px; border-radius: 8px; font-weight: bold; font-size: 14px;">
              Solicitar Reenvío
            </a>
          </td>
          <td style="padding-left: 8px; width: 50%;">
            <a href="${returnUrl}" style="display: block; text-align: center; background-color: #ffffff; color: #a94442; text-decoration: none; padding: 13px 12px; border-radius: 8px; font-weight: bold; font-size: 14px; border: 1px solid #d9534f;">
              Solicitar Devolución
            </a>
          </td>
        </tr>
      </table>
      <p style="color: #888; font-size: 13px; line-height: 1.5;">
        Si no recibimos tu respuesta, o si la entrega vuelve a fallar, el pedido será devuelto a
        nuestro almacén y se iniciará el proceso de reembolso.
      </p>`);

  return {
    subject: `Tu pedido #${orderId} no pudo ser entregado — Necesitamos tu decisión`,
    html: html.trim(),
  };
}

/** Email 3.2 — Confirmación de solicitud de reenvío. */
export function buildRedeliveryConfirmationEmail(params: {
  userName: string;
  orderId: number;
}): { subject: string; html: string } {
  const { userName, orderId } = params;
  const html = wrapper(`
      <h2 style="color: #3f3f3f; margin-top: 0;">¡Solicitud recibida, ${userName}!</h2>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Hemos registrado tu solicitud de <strong>reenvío</strong> para el pedido <strong>#${orderId}</strong>.
        Nuestro equipo de logística programará una nueva entrega en las próximas horas.
      </p>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Recuerda tener a la mano tu <strong>PIN de entrega de 6 dígitos</strong> (enviado al confirmar tu compra)
        para entregarlo al repartidor. También puedes consultarlo en la sección
        <em>Mis Pedidos</em> de tu perfil.
      </p>`);
  return {
    subject: `Solicitud de reenvío recibida — Pedido #${orderId}`,
    html: html.trim(),
  };
}

/** Email 3.3 — Confirmación de devolución solicitada por el cliente. */
export function buildReturnConfirmationEmail(params: {
  userName: string;
  orderId: number;
}): { subject: string; html: string } {
  const { userName, orderId } = params;
  const html = wrapper(`
      <h2 style="color: #3f3f3f; margin-top: 0;">Solicitud de devolución registrada</h2>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Hola ${userName}, hemos registrado tu solicitud de <strong>devolución</strong> para el pedido
        <strong>#${orderId}</strong>. Los productos serán reincorporados a nuestro almacén.
      </p>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        El reembolso del importe pagado será procesado por nuestro equipo a través de tu medio de pago
        original. Te notificaremos cuando el proceso haya sido completado.
      </p>`);
  return {
    subject: `Solicitud de devolución registrada — Pedido #${orderId}`,
    html: html.trim(),
  };
}

/** Email 3.4 — Devolución forzada tras agotar los intentos de entrega. */
export function buildForcedReturnEmail(params: {
  userName: string;
  orderId: number;
  attemptNumber: number;
}): { subject: string; html: string } {
  const { userName, orderId, attemptNumber } = params;
  const html = wrapper(`
      <h2 style="color: #3f3f3f; margin-top: 0;">No fue posible entregar tu pedido</h2>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Hola ${userName}, luego de <strong>${attemptNumber} intentos de entrega</strong> no fue posible
        completar la entrega de tu pedido <strong>#${orderId}</strong>.
      </p>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        El pedido ha sido devuelto a nuestro almacén y se ha iniciado el proceso de
        <strong>reembolso</strong> a tu medio de pago original. Te notificaremos cuando haya sido procesado.
      </p>
      <p style="color: #888; font-size: 13px; line-height: 1.5;">
        Si crees que esto es un error o necesitas ayuda, contáctanos a través de nuestros canales de atención.
      </p>`);
  return {
    subject: `Pedido #${orderId} devuelto — Iniciamos tu reembolso`,
    html: html.trim(),
  };
}
