import request from 'supertest';
import app from '../app';
import prisma from '../infrastructure/database/prisma';
import { JwtService } from '../infrastructure/services/JwtService';

const jwtService = new JwtService();

describe('LoyaltyConfig & RedeemLoyaltyPoints (Audit Fix)', () => {
  let adminToken: string;
  let clientToken: string;
  let clientId: number;

  beforeAll(async () => {
    // 1. Limpiar base de datos (tablas relevantes)
    await prisma.loyaltyAccount.deleteMany();
    await prisma.loyaltyConfig.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { in: ['admin.loyalty@test.com', 'client.loyalty@test.com'] } }
    });

    // 2. Crear admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin.loyalty@test.com',
        password: 'hash',
        name: 'Admin Loyalty',
        isActive: true,
      }
    });

    adminToken = jwtService.generateTokens({
      userId: admin.id,
      email: admin.email,
      role: 'ADMIN'
    }).accessToken;

    // 3. Crear client user
    const client = await prisma.user.create({
      data: {
        email: 'client.loyalty@test.com',
        password: 'hash',
        name: 'Client Loyalty',
        isActive: true,
      }
    });
    clientId = client.id;

    clientToken = jwtService.generateTokens({
      userId: client.id,
      email: client.email,
      role: 'CLIENT'
    }).accessToken;
  });

  afterAll(async () => {
    await prisma.loyaltyAccount.deleteMany();
    await prisma.loyaltyConfig.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { in: ['admin.loyalty@test.com', 'client.loyalty@test.com'] } }
    });
  });

  describe('Fase 1: Configuración de Reglas (Admin)', () => {
    it('Debe rechazar peticiones PUT de usuarios sin rol ADMIN (Validación 403)', async () => {
      const response = await request(app)
        .put('/api/v1/admin/loyalty-config')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ solesPerPoint: 50 });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Acceso denegado');
    });

    it('Debe permitir al ADMIN consultar y actualizar la regla (ej. 5 soles = 1 punto)', async () => {
      // 1. Obtener la config inicial (debe crear la default si no existe)
      const getResponse = await request(app)
        .get('/api/v1/admin/loyalty-config')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.solesPerPoint).toBeDefined();

      // 2. Actualizar la config
      const putResponse = await request(app)
        .put('/api/v1/admin/loyalty-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ solesPerPoint: 5 });

      expect(putResponse.status).toBe(200);
      expect(putResponse.body.success).toBe(true);
      expect(Number(putResponse.body.data.solesPerPoint)).toBe(5);
    });
  });

  describe('Fase 2 & 3: Canje y Seguridad de Puntos (Client)', () => {
    beforeAll(async () => {
      // Darle puntos al cliente para que pueda canjear
      await prisma.loyaltyAccount.create({
        data: {
          userId: clientId,
          balance: 100,
        }
      });
    });

    it('Debe rechazar un canje si el cliente no tiene suficientes puntos', async () => {
      const response = await request(app)
        .post('/api/v1/loyalty/redeem')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ points: 200 }); // Intentar canjear 200 pero solo tiene 100

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Puntos insuficientes');
    });

    it('Debe asegurar que un cliente solo canjea SUS PROPIOS puntos aunque mande otro userId en el body', async () => {
      // Client manda un body con userId malicioso (ej. userId = 1)
      const response = await request(app)
        .post('/api/v1/loyalty/redeem')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ userId: 1, points: 50 });

      // Dado que es cliente e-commerce, el backend ignora userId: 1 y descuenta de clientId
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.discountAmount).toBe(50);
      expect(response.body.data.newBalance).toBe(50); // Tenia 100, gastó 50
    });
  });
});
