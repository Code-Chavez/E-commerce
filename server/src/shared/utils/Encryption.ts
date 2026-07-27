import bcrypt from 'bcrypt';

export class Encryption {
  /**
   * Genera un hash seguro para una contraseña usando un factor de coste dinámico.
   * El factor de coste (salt rounds) se puede configurar vía variables de entorno.
   * Por defecto es 10 si no se especifica.
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = process.env.BCRYPT_SALT_ROUNDS 
      ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) 
      : 10;
      
    const salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compara una contraseña en texto plano con un hash almacenado.
   * Retorna true si coinciden, false en caso contrario.
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
