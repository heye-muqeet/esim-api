// utils/referral.ts
import db from '@/utils/prisma';

export const generateInviteCode = async (): Promise<string> => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 12; 
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    let code = '';
    for (let i = 0; i < codeLength; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    const existing = await db.user.findUnique({
      where: { inviteCode: code },
    });

    if (!existing) return code;
    attempts++;
  }

  throw new Error('Failed to generate unique invite code');
};