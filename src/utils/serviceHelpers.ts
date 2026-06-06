import { ServiceResult } from '../services/types';

export const createSuccess = <T>(data: T): ServiceResult<T> => ({
  ok: true,
  data,
});

export const createError = <T>(error: string): ServiceResult<T> => ({
  ok: false,
  error,
});