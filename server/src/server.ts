import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import app from './app';
import prisma from './infrastructure/database/prisma';
import { StockAlertJob } from './infrastructure/jobs/StockAlertJob';
import { PendingOrderAlertJob } from './infrastructure/jobs/PendingOrderAlertJob';
import { AbandonedCartJob } from './infrastructure/jobs/AbandonedCartJob';
import { BirthdayCouponJob } from './infrastructure/jobs/BirthdayCouponJob';
import { NPSSurveyJob } from './infrastructure/jobs/NPSSurveyJob';
import { SalesAnomalyJob } from './infrastructure/jobs/SalesAnomalyJob';
import { FailedDeliveryExpiryJob } from './infrastructure/jobs/FailedDeliveryExpiryJob';

const PORT = process.env.SERVER_PORT || 3000;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    StockAlertJob.start();
    PendingOrderAlertJob.start();
    AbandonedCartJob.start();
    BirthdayCouponJob.start();
    NPSSurveyJob.start();
    SalesAnomalyJob.start();
    FailedDeliveryExpiryJob.start();
    console.log('📦 Tareas programadas iniciadas correctamente.');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    process.exit(1);
  }
};

startServer();
