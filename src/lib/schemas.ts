import { z } from 'zod';

export const createSimSchema = z.object({
  orderNo: z.string().min(1, 'Order number is required'),
  esimTranNo: z.string().optional(),
  iccid: z.string().optional(),
  transactionId: z.string().min(1, 'Transaction ID is required'),
});

export const updateSimSchema = z.object({
  id: z.number().int().positive().optional(), // Add id to body for update
  orderNo: z.string().min(1, 'Order number is required').optional(),
  esimTranNo: z.string().optional(),
  iccid: z.string().optional(),
  transactionId: z.string().min(1, 'Transaction ID is required').optional(),
});

export const getSimSchema = z.object({
  userId: z.number().int().positive(),
});

export const getOneSimSchema = z.object({
  id: z.number().int().positive(), // Expect id in body
  userId: z.number().int().positive(),
});

export const deleteSimSchema = z.object({
  id: z.number().int().positive(), // Expect id in body
  userId: z.number().int().positive(),
});