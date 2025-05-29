import { z } from 'zod';
import db from '@/utils/prisma';
import { Sim } from '@prisma/generated';

export const createSimSchema = z.object({
  orderNo: z.string().min(1, 'Order number is required'),
  esimTranNo: z.string().optional(),
  iccid: z.string().optional(),
  transactionId: z.string().min(1, 'Transaction ID is required'),
});

export const updateSimSchema = z.object({
  orderNo: z.string().min(1, 'Order number is required').optional(),
  esimTranNo: z.string().optional(),
  iccid: z.string().optional(),
  transactionId: z.string().min(1, 'Transaction ID is required').optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export async function createSim(userId: number, createSimDetails: z.infer<typeof createSimSchema>): Promise<Sim> {
  console.log('Creating SIM with:', { userId, createSimDetails });

  const { orderNo, esimTranNo, iccid, transactionId } = createSimDetails;
  const conditions: any[] = [{ orderNo }];
  if (esimTranNo) conditions.push({ esimTranNo });
  if (iccid) conditions.push({ iccid });

  const existing = await db.sim.findFirst({
    where: { OR: conditions },
  });

  if (existing) {
    console.error('Duplicate SIM entry:', existing);
    throw new Error('Order number, eSIM transaction number, or ICCID already exists');
  }

  try {
    const sim = await db.sim.create({
      data: {
        orderNo,
        esimTranNo,
        iccid,
        transactionId,
        userId,
      },
      include: { user: true },
    });
    console.log('SIM creation successful:', sim);
    return sim;
  } catch (error: any) {
    console.error('SIM creation failed:', error);
    if (error.code === 'P2002') {
      throw new Error('Duplicate entry for orderNo, esimTranNo, or iccid');
    }
    throw new Error(`Failed to create SIM details: ${error.message}`);
  }
}

export async function findAllSimsByUser(userId: number): Promise<Sim[]> {
  console.log('Fetching SIMs for user:', userId);
  const sims = await db.sim.findMany({
    where: { userId },
    include: { user: true },
  });
  console.log('Fetched SIMs:', sims.length);
  return sims;
}

export async function findOneSim(id: number, userId: number): Promise<Sim> {
  console.log('Fetching SIM:', { id, userId });
  const sim = await db.sim.findFirst({
    where: { id, userId },
    include: { user: true },
  });

  if (!sim) {
    throw new Error('SIM details not found');
  }
  console.log('Fetched SIM:', sim);
  return sim;
}

export async function updateSim(id: number, userId: number, updateSimDetails: z.infer<typeof updateSimSchema>): Promise<Sim> {
  console.log('Updating SIM:', { id, userId, updateSimDetails });
  const existing = await db.sim.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('SIM details not found');
  }

  try {
    const updatedSim = await db.sim.update({
      where: { id },
      data: updateSimDetails,
      include: { user: true },
    });
    console.log('SIM update successful:', updatedSim);
    return updatedSim;
  } catch (error: any) {
    console.error('SIM update failed:', error);
    throw new Error(`Failed to update SIM details: ${error.message}`);
  }
}

export async function removeSim(id: number, userId: number): Promise<void> {
  console.log('Deleting SIM:', { id, userId });
  const sim = await db.sim.findFirst({
    where: { id, userId },
  });

  if (!sim) {
    throw new Error('SIM details not found or not owned by user');
  }

  await db.sim.delete({
    where: { id },
  });
  console.log('SIM deletion successful:', id);
}