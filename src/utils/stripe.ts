// utils/stripe.ts
import Stripe from 'stripe';
import db from '@/utils/prisma';

export class StripeService {
    private stripe: Stripe;

    constructor() {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2025-05-28.basil',
        });
    }

    async createPaymentIntent(
        amount: number,
        currency: string,
        paymentMethodType: string,
        user: { id: number; email: string; name: string | null; stripeCustomerId: string | null }
    ) {
        try {
            // Validate inputs
            if (!amount || amount <= 0) {
                throw new Error('Invalid amount');
            }
            if (!currency) {
                throw new Error('Currency is required');
            }
            const validTypes = ['card']; // Add 'paypal' if supported
            if (!validTypes.includes(paymentMethodType)) {
                throw new Error('Invalid payment method type');
            }
            if (!user || !user.id) {
                throw new Error('Invalid user');
            }

            // Get or create Stripe customer
            let customerId = user.stripeCustomerId;
            if (!customerId) {
                const customer = await this.stripe.customers.create({
                    email: user.email,
                    name: user.name || undefined,
                });
                customerId = customer.id;

                // Update user with stripeCustomerId
                await db.user.update({
                    where: { id: user.id },
                    data: { stripeCustomerId: customerId },
                });
            }

            // Create payment intent
            const params: Stripe.PaymentIntentCreateParams = {
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                customer: customerId,
                payment_method_types: [paymentMethodType],
            };

            const paymentIntent = await this.stripe.paymentIntents.create(params);

            // Create ephemeral key
            const ephemeralKey = await this.stripe.ephemeralKeys.create(
                { customer: customerId },
                { apiVersion: '2025-03-31.basil' }
            );

            return {
                clientSecret: paymentIntent.client_secret,
                ephemeralSecret: ephemeralKey.secret,
                customerId,
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
            };
        } catch (error: any) {
            console.error('Stripe error:', error);
            throw new Error(`Stripe error: ${error.message}`);
        }
    }
}

export const stripeService = new StripeService();