// src/stripe/stripe.service.ts
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor(private readonly configService: ConfigService) {
        this.stripe = new Stripe(
            this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
            {
                apiVersion: '2025-03-31.basil',
            }
        );
    }

    async createPaymentIntent(amount: number, currency: string, paymentMethodType: string,) {
        try {

            // Validate payment method type
            const validTypes = ['card', 'paypal'];
            if (!validTypes.includes(paymentMethodType)) {
                console.log({paymentMethodType})
                throw new Error('Invalid payment method type');
            }

            // In production, you would create/lookup customer based on your user
            const customer = await this.stripe.customers.create();

            const params: Stripe.PaymentIntentCreateParams = {
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                customer: customer.id,
            };

            // Handle different payment methods
            if (paymentMethodType === 'card') {
                params.automatic_payment_methods = {
                    enabled: true,
                };
            } else {
                params.payment_method_types = [paymentMethodType];
            }

            const paymentIntent = await this.stripe.paymentIntents.create(params);
            console.log(paymentIntent)

            const ephemeralKey = await this.stripe.ephemeralKeys.create(
                { customer: customer.id },
                { apiVersion: '2025-03-31.basil' }
            );

            return {
                clientSecret: paymentIntent.client_secret,
                ephemeralSecret: ephemeralKey.secret,
                customerId: customer.id,
                publishableKey: this.configService.get('STRIPE_PUBLISHABLE_KEY'),
            };
        } catch (error) {
            throw new Error(`Stripe error: ${error.message}`);
        }
    }
}
