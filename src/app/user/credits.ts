// pages/api/user/credits.ts
import { NextResponse } from 'next/server';
import db from '@/utils/prisma';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const schema = z.object({
  creditsUsed: z.number().min(0, 'Credits used must be non-negative.'),
});

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const body = await request.json();
    const validationResult = schema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { creditsUsed } = validationResult.data;

    return await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: decoded.userId },
      });
      if (!user || user.credits < creditsUsed) {
        return NextResponse.json(
          { success: false, message: 'Insufficient credits' },
          { status: 400 }
        );
      }

      await tx.user.update({
        where: { id: decoded.userId },
        data: { credits: { decrement: creditsUsed } },
      });

      return NextResponse.json({ success: true, message: 'Credits updated' }, { status: 200 });
    });
  } catch (err) {
    console.error('Credits error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}