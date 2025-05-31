// pages/api/user/credits.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/utils/prisma';
import { authMiddleware } from '@/middleware/auth';
import { userCreditsSchema } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  console.log('Received POST to /user/credits'); // Debug log

  const middlewareResponse = await authMiddleware(req);
  if (middlewareResponse) return middlewareResponse;

  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      console.error('Invalid user authentication:', { user });
      return NextResponse.json(
        { success: false, message: 'Invalid user authentication' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validationResult = userCreditsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { creditsUsed } = validationResult.data;

    return await db.$transaction(async (tx) => {
      if (!user || user.credits < creditsUsed) {
        return NextResponse.json(
          { success: false, message: 'Insufficient credits' },
          { status: 400 }
        );
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { credits: { decrement: creditsUsed } },
      });

      return NextResponse.json(
        { 
          success: true, 
          message: 'Credits updated',
          data: { user: updatedUser }
        }, 
        { status: 200 }
      );
    });
  } catch (err) {
    console.error('Credits error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}