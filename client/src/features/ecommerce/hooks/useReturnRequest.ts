import { useState } from 'react';
import { returnService } from '../services/return.service';
import type { ReturnRequestInput, ReturnRequest } from '../types';
import toast from 'react-hot-toast';

export const useReturnRequest = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<ReturnRequest | null>(null);

  const createReturn = async (input: ReturnRequestInput) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await returnService.createReturnRequest(input);
      setData(response);
      setSuccess(true);
      toast.success('Solicitud de devolución registrada con éxito.');
      return response;
    } catch (err: any) {
      const errMsg = err.message || 'Error al enviar la solicitud de devolución';
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createReturn,
    isSubmitting,
    error,
    success,
    data,
  };
};
