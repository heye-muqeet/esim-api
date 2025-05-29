// middleware/auth.ts
import { NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import db from '@/utils/prisma';

export async function authMiddleware(req: Request) {
    try {
        // Get token from Authorization header
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized: No token provided' },
                { status: 401 }
            );
        }

        // Decode and verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        if (!decoded.userId) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized: Invalid token' },
                { status: 401 }
            );
        }

        // Fetch user from database
        const user = await db.user.findUnique({ where: { id: decoded.userId } });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized: User not found' },
                { status: 404 }
            );
        }

        // Attach user to request
        (req as any).user = user;

        return null;
    } catch (err: any) {
        console.error('Auth middleware error:', err);
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return NextResponse.json(
                { success: false, message: 'Unauthorized: Invalid or expired token' },
                { status: 401 }
            );
        }
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// usage

// import { NextRequest, NextResponse } from 'next/server';
// import { authMiddleware } from '@/middleware/auth';

// export async function GET(req: NextRequest) {
//   const middlewareResponse = await authMiddleware(req);
//   if (middlewareResponse) return middlewareResponse;

//   const user = (req as any).user;

//   return NextResponse.json({ success: true, user }, { status: 200 });
// }