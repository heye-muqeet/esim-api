import { NextResponse } from 'next/server';
import db from '@/utils/prisma';
import { authMiddleware } from '@/middleware/auth';
import { createSimSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  // Apply authentication middleware
  const authResponse = await authMiddleware(req);
  if (authResponse) return authResponse;

  try {
    const user = (req as any).user;
    const body = await req.json();

    // Validate request body
    const validation = createSimSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors },
        { status: 400 }
      );
    }

    const { orderNo, esimTranNo, iccid, transactionId } = validation.data;

    // Check for duplicates
    const conditions: any[] = [{ orderNo }];
    if (esimTranNo) conditions.push({ esimTranNo });
    if (iccid) conditions.push({ iccid });

    const existing = await db.sim.findFirst({
      where: { OR: conditions },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Order number, eSIM transaction number, or ICCID already exists' },
        { status: 400 }
      );
    }

    // Create new SIM details
    const simDetails = await db.sim.create({
      data: {
        orderNo,
        esimTranNo,
        iccid,
        transactionId,
        userId: user.id,
      },
      include: { user: true },
    });

    return NextResponse.json(
      { success: true, data: simDetails },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create SIM details error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Duplicate entry for orderNo, esimTranNo, or iccid' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: `Failed to create SIM details: ${error.message}` },
      { status: 500 }
    );
  }
}