// pages/api/user/profile.ts
import { NextResponse } from 'next/server';
import db from '@/utils/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true, inviteCode: true, credits: true },
    });

    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (err) {
    console.error('Profile error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}