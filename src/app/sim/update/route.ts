import { NextResponse } from 'next/server';
import db from '@/utils/prisma';
import { authMiddleware } from '@/middleware/auth';
import { updateSimSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  const authResponse = await authMiddleware(req);
  if (authResponse) return authResponse;

  try {
    const user = (req as any).user;
    const body = await req.json();

    // Validate request body (include id in the body)
    const validation = updateSimSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors },
        { status: 400 }
      );
    }

    if (!body.id || isNaN(body.id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing ID in request body' },
        { status: 400 }
      );
    }

    const id = parseInt(body.id);

    if (Object.keys(validation.data).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No update values provided' },
        { status: 400 }
      );
    }

    // Check if SIM details exist
    const existing = await db.sim.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'SIM details not found' },
        { status: 404 }
      );
    }

    // Update SIM details
    const updatedSimDetails = await db.sim.update({
      where: { id },
      data: validation.data,
      include: { user: true },
    });

    return NextResponse.json(
      { success: true, data: updatedSimDetails },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update SIM details error:', error);
    return NextResponse.json(
      { success: false, message: `Failed to update SIM details: ${error.message}` },
      { status: 500 }
    );
  }
}