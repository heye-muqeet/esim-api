// pages/api/stripe/create-payment-intent.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authMiddleware } from '@/middleware/auth';
import { stripeService } from '@/utils/stripe';

const paymentIntentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().min(3, 'Currency is required').max(3, 'Invalid currency'),
    payment_method_type: z.enum(['card'], { errorMap: () => ({ message: 'Invalid payment method type' }) }), // Add 'paypal' if supported
});

export async function POST(req: NextRequest) {
    console.log('Received POST to /api/stripe/create-payment-intent'); // Debug log

    // Apply auth middleware
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
        const validationResult = paymentIntentSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { success: false, message: 'Invalid request body', errors: validationResult.error.errors },
                { status: 400 }
            );
        }

        const { amount, currency, payment_method_type } = validationResult.data;

        const result = await stripeService.createPaymentIntent(amount, currency, payment_method_type, {
            id: user.id,
            email: user.email,
            name: user.name,
            stripeCustomerId: user.stripeCustomerId,
        });

        return NextResponse.json(
            {
                success: true,
                data: result,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Payment Intent Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'An error occurred while creating payment intent.' },
            { status: 500 }
        );
    }
}