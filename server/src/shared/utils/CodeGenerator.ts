import crypto from 'crypto';

export class CodeGenerator {
  /**
   * Genera un PIN numérico aleatorio y seguro de 6 dígitos.
   */
  static generatePin(): string {
    return crypto.randomInt(100000, 999999).toString();
  }
}
