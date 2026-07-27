import { InvalidDeliveryStateTransitionError } from '@domain/errors/InvalidDeliveryStateTransitionError';

export class DeliveryStateMachine {
  /**
   * Mapa de transiciones permitidas.
   * Clave: Estado actual
   * Valor: Array de estados permitidos hacia los que puede transicionar
   */
  private static readonly allowedTransitions: Record<string, string[]> = {
    PENDING: ['ASSIGNED', 'CANCELLED'],
    ASSIGNED: ['IN_TRANSIT', 'CANCELLED'],
    IN_TRANSIT: ['DELIVERED', 'FAILED'],
    FAILED: ['AWAITING_CLIENT_DECISION', 'RETURNED'],
    AWAITING_CLIENT_DECISION: ['RETURNED', 'PENDING'],
    DELIVERED: [],
    CANCELLED: [],
    RETURNED: [],
  };

  /**
   * Valida si la transición de un estado a otro es permitida según las reglas de negocio.
   * @param currentStatus Estado actual del envío
   * @param newStatus Nuevo estado al que se desea pasar
   * @throws InvalidDeliveryStateTransitionError si la transición no está permitida
   */
  static validateTransition(currentStatus: string, newStatus: string): void {
    if (currentStatus === newStatus) {
      return; // No-op, same state
    }

    const allowed = this.allowedTransitions[currentStatus];

    if (!allowed || !allowed.includes(newStatus)) {
      throw new InvalidDeliveryStateTransitionError(currentStatus, newStatus);
    }
  }
}
