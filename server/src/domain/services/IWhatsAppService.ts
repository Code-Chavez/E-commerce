export interface IWhatsAppService {
  /**
   * Envia un mensaje de WhatsApp a un número específico
   * @param phone El número de teléfono destino (formato internacional)
   * @param template Nombre o identificador del template del mensaje
   * @param params Variables que se inyectarán en el template
   */
  sendMessage(phone: string, template: string, params: Record<string, string>): Promise<boolean>;
}
