// /app/api/sim/get-all/route.ts (or route.js)
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/auth';
import db from '@/utils/prisma';

export async function POST(req: NextRequest) {
  const auth = await authMiddleware(req);
  if (auth) return auth;

  const user = (req as any).user;

  try {
    const sims = await db.sim.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(sims, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching SIMs:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch SIM details' },
      { status: 500 }
    );
  }
}
