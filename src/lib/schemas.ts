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

export const userCreditsSchema = z.object({
  creditsUsed: z.number().min(0, 'Credits used must be non-negative.'),
});

export const paymentIntentSchema = z.object({
  amount: z.number().min(0, 'Amount must be non-negative.'),
  currency: z.string().min(1, 'Currency is required'),
  payment_method_type: z.string().min(1, 'Payment method type is required'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  credits: z.object({
    action: z.enum(['increment', 'decrement']),
    amount: z.number().positive('Amount must be positive')
  }).optional(),
  password: z.object({
    currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
  }).optional()
}).refine(data => {
  // Ensure at least one field is provided
  return data.name !== undefined || data.credits !== undefined || data.password !== undefined;
}, {
  message: 'At least one field must be provided for update'
});
  