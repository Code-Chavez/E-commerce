import { Router } from 'express';
import { BlogPostController } from '@infrastructure/http/controllers/BlogPostController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const controller = new BlogPostController();

// Public routes
router.get('/blog', controller.getPublicList.bind(controller));
router.get('/blog/:slug', controller.getPublicBySlug.bind(controller));

// Admin routes
router.get('/admin/blog', requirePermission('roles:manage'), controller.getAll.bind(controller));
router.get('/admin/blog/:id', requirePermission('roles:manage'), controller.getOne.bind(controller));
router.post('/admin/blog', requirePermission('roles:manage'), controller.create.bind(controller));
router.patch('/admin/blog/:id', requirePermission('roles:manage'), controller.update.bind(controller));
router.delete('/admin/blog/:id', requirePermission('roles:manage'), controller.delete.bind(controller));

export default router;
