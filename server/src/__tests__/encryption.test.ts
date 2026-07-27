import { describe, it, expect } from '@jest/globals';
import { Encryption } from '../shared/utils/Encryption';

describe('Encryption Utility (bcrypt)', () => {
  const plainPassword = 'SuperSecretPassword123!';

  it('should hash a password successfully and return a different string', async () => {
    const hashedPassword = await Encryption.hashPassword(plainPassword);
    
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(plainPassword);
    // Un hash de bcrypt siempre empieza típicamente con $2a$, $2b$ o $2y$
    expect(hashedPassword).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it('should return true when comparing the correct password with its hash', async () => {
    const hashedPassword = await Encryption.hashPassword(plainPassword);
    const isMatch = await Encryption.comparePassword(plainPassword, hashedPassword);
    
    expect(isMatch).toBe(true);
  });

  it('should return false when comparing an incorrect password with a hash', async () => {
    const hashedPassword = await Encryption.hashPassword(plainPassword);
    const wrongPassword = 'WrongPassword456!';
    const isMatch = await Encryption.comparePassword(wrongPassword, hashedPassword);
    
    expect(isMatch).toBe(false);
  });
});


