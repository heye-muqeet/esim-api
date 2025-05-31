import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/utils/prisma';
import { authMiddleware } from '@/middleware/auth';
import { updateUserSchema } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  console.log('Received POST to /user/update');

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
    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, credits, password } = validationResult.data;

    return await db.$transaction(async (tx) => {
      // Get current user data
      const currentUser = await tx.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          credits: true
        }
      });

      if (!currentUser) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      const updateData: any = {};

      // Handle name update
      if (name) {
        updateData.name = name;
      }

      // Handle credits update
      if (credits) {
        if (credits.action === 'decrement') {
          if (Number(currentUser.credits) < credits.amount) {
            return NextResponse.json(
              { success: false, message: 'Insufficient credits' },
              { status: 400 }
            );
          }
          updateData.credits = { decrement: credits.amount };
        } else {
          updateData.credits = { increment: credits.amount };
        }
      }

      // Handle password update
      if (password) {
        const isPasswordValid = await bcrypt.compare(
          password.currentPassword,
          currentUser.password
        );

        if (!isPasswordValid) {
          return NextResponse.json(
            { success: false, message: 'Current password is incorrect' },
            { status: 400 }
          );
        }

        const hashedPassword = await bcrypt.hash(password.newPassword, 10);
        updateData.password = hashedPassword;
      }

      // Update user
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          credits: true,
          inviteCode: true,
          referredBy: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return NextResponse.json(
        {
          success: true,
          message: 'User updated successfully',
          data: { user: updatedUser }
        },
        { status: 200 }
      );
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
