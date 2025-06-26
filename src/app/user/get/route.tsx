import { NextRequest, NextResponse } from 'next/server';
import db from '@/utils/prisma';
import { authMiddleware } from '@/middleware/auth';

export async function POST(req: NextRequest) {
  console.log('Received POST to /user/get');

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

    // Get user details with sensitive fields excluded
    const userDetails = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        inviteCode: true,
        credits: true,
        referredBy: true,
      }
    });

    if (!userDetails) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'User details retrieved successfully',
        data: { user: userDetails }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user details error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
