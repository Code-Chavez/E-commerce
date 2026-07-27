import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '@infrastructure/database/prisma';
import { CloudinaryStorageService } from '@infrastructure/services/CloudinaryStorageService';

const storageService = new CloudinaryStorageService();

export const getSocialProofs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const proofs = await prisma.socialProofPhoto.findMany({
      where: { isApproved: true },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(proofs);
  } catch (error) {
    next(error);
  }
};

export const getAdminSocialProofs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const proofs = await prisma.socialProofPhoto.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(proofs);
  } catch (error) {
    next(error);
  }
};

export const createSocialProof = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientName = req.body.clientName;
    if (!clientName) {
      res.status(400).json({ error: 'El nombre del cliente es requerido' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'La imagen es requerida' });
      return;
    }

    const imageUrl = await storageService.uploadImage(
      file.buffer,
      file.originalname,
      'social-proof'
    );

    const proof = await prisma.socialProofPhoto.create({
      data: {
        clientName,
        imageUrl,
        isApproved: false, // Requires admin approval by default
      },
    });

    res.status(201).json(proof);
  } catch (error) {
    next(error);
  }
};

export const approveSocialProof = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (typeof isApproved !== 'boolean') {
      res.status(400).json({ error: 'isApproved debe ser booleano' });
      return;
    }

    const proof = await prisma.socialProofPhoto.update({
      where: { id: Number(id) },
      data: { isApproved },
    });

    res.json(proof);
  } catch (error) {
    next(error);
  }
};

export const deleteSocialProof = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const proof = await prisma.socialProofPhoto.findUnique({
      where: { id: Number(id) },
    });
    if (!proof) {
      res.status(404).json({ error: 'No encontrado' });
      return;
    }

    await storageService.deleteImage(proof.imageUrl);
    await prisma.socialProofPhoto.delete({ where: { id: Number(id) } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
