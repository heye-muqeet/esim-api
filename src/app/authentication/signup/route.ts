// pages/api/auth/signup.ts
import { z } from 'zod';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '@/utils/prisma';
import { generateInviteCode } from '@/utils/referral';

const registrationSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email format.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
  inviteCode: z.string().length(12, 'Invite code must be 12 characters.').optional(),
});

export async function POST(request: Request) {
  console.log('Received POST to /api/auth/signup'); // Debug log
  try {
    const body = await request.json();
    const validationResult = registrationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, email, password, inviteCode } = validationResult.data;

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    return await db.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({
        where: { email: email.toLowerCase() },
      });
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Email already exists.' },
          { status: 409 }
        );
      }

      let referrer = null;
      if (inviteCode) {
        referrer = await tx.user.findUnique({
          where: { inviteCode },
        });
        if (!referrer) {
          return NextResponse.json(
            { success: false, message: 'Invalid invite code.' },
            { status: 400 }
          );
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newInviteCode = await generateInviteCode();
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          inviteCode: newInviteCode,
          referredBy: inviteCode || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          inviteCode: true,
          credits: true,
          referredBy: true,
        },
      });

      if (referrer) {
        await tx.user.update({
          where: { id: referrer.id },
          data: { credits: { increment: 3.00 } },
        });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);

      return NextResponse.json(
        {
          success: true,
          message: 'User registered successfully.',
          user,
          token,
        },
        { status: 201 }
      );
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while registering the user.' },
      { status: 500 }
    );
  }
}