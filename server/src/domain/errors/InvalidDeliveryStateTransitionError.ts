export class InvalidDeliveryStateTransitionError extends Error {
  constructor(currentStatus: string, newStatus: string) {
    super(`No se permite la transición de estado del envío de ${currentStatus} a ${newStatus}.`);
    this.name = 'InvalidDeliveryStateTransitionError';
  }
}
