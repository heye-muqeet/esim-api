import { NextResponse } from 'next/server';
import db from '@/utils/prisma';
import { authMiddleware } from '@/middleware/auth';
import { getOneSimSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  const authResponse = await authMiddleware(req);
  if (authResponse) return authResponse;

  try {
    const user = (req as any).user;
    const body = await req.json();

    // Validate request body (id comes from body, not params)
    const validation = getOneSimSchema.safeParse({ id: body.id, userId: user.id });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors },
        { status: 400 }
      );
    }

    const { id } = validation.data;

    const simDetails = await db.sim.findFirst({
      where: { id, userId: user.id },
      include: { user: true },
    });

    if (!simDetails) {
      return NextResponse.json(
        { success: false, message: 'SIM details not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: simDetails },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get one SIM detail error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch SIM detail' },
      { status: 500 }
    );
  }
}