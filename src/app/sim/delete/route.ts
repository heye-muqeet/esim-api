import { NextResponse } from 'next/server';
import db from '@/utils/prisma';
import { authMiddleware } from '@/middleware/auth';
import { deleteSimSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  const authResponse = await authMiddleware(req);
  if (authResponse) return authResponse;

  try {
    const user = (req as any).user;
    const body = await req.json();

    // Validate request body (id comes from body)
    const validation = deleteSimSchema.safeParse({ id: body.id, userId: user.id });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors },
        { status: 400 }
      );
    }

    const { id } = validation.data;

    // Check if SIM details exist
    const simDetails = await db.sim.findFirst({
      where: { id, userId: user.id },
    });

    if (!simDetails) {
      return NextResponse.json(
        { success: false, message: 'SIM details not found or not owned by user' },
        { status: 404 }
      );
    }

    // Delete SIM details
    await db.sim.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: 'SIM details deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete SIM details error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete SIM details' },
      { status: 500 }
    );
  }
}