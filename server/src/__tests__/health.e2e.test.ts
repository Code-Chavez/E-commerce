import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../app';

describe('Health Check (E2E)', () => {
  it('debería retornar HTTP 200 y status ok cuando el contenedor expone el puerto correctamente', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });
});
