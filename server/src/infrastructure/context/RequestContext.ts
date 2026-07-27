import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response, NextFunction } from 'express';

export interface RequestStore {
  userId?: number;
  email?: string;
}

export const requestContext = new AsyncLocalStorage<RequestStore>();

export const setContextUser = (userId: number, email: string): void => {
  const store = requestContext.getStore();
  if (store) {
    store.userId = userId;
    store.email = email;
  }
};

export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const store: RequestStore = {
    userId: req.auth?.userId,
    email: req.auth?.email,
  };

  requestContext.run(store, () => {
    next();
  });
};
