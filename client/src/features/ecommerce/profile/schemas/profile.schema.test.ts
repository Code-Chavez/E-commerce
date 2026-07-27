import { describe, it, expect } from 'vitest';
import { profileSchema } from './profile.schema';

describe('Profile Validation Schema', () => {
  it('should validate a correct profile form data successfully', async () => {
    const validData = {
      name: 'Carlos',
      lastName: 'Gómez',
      phone: '+51987654321',
    };

    const isValid = await profileSchema.isValid(validData);
    expect(isValid).toBe(true);
  });

  it('should reject a phone number that is not in E.164 format', async () => {
    const invalidData = {
      name: 'Carlos',
      lastName: 'Gómez',
      phone: '987654321', // No '+' prefix and no country code
    };

    const isValid = await profileSchema.isValid(invalidData);
    expect(isValid).toBe(false);

    try {
      await profileSchema.validate(invalidData);
    } catch (err: any) {
      expect(err.message).toContain('teléfono debe estar en formato internacional E.164');
    }
  });

  it('should reject name shorter than 2 characters', async () => {
    const invalidData = {
      name: 'C',
      lastName: 'Gómez',
      phone: '+51987654321',
    };

    const isValid = await profileSchema.isValid(invalidData);
    expect(isValid).toBe(false);

    try {
      await profileSchema.validate(invalidData);
    } catch (err: any) {
      expect(err.message).toContain('El nombre debe tener al menos 2 caracteres');
    }
  });

  it('should reject name longer than 50 characters', async () => {
    const invalidData = {
      name: 'C'.repeat(51),
      lastName: 'Gómez',
      phone: '+51987654321',
    };

    const isValid = await profileSchema.isValid(invalidData);
    expect(isValid).toBe(false);

    try {
      await profileSchema.validate(invalidData);
    } catch (err: any) {
      expect(err.message).toContain('El nombre no puede exceder los 50 caracteres');
    }
  });

  it('should require name, lastName, and phone', async () => {
    const invalidData = {
      name: '',
      lastName: '',
      phone: '',
    };

    const isValid = await profileSchema.isValid(invalidData);
    expect(isValid).toBe(false);
  });
});
