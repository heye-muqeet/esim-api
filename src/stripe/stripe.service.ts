// src/stripe/stripe.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/typeorm/entities/user.entity';

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        this.stripe = new Stripe(
            this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
            {
                apiVersion: '2025-03-31.basil',
            },
        );
    }

    async createPaymentIntent(
        amount: number,
        currency: string,
        paymentMethodType: string,
        user: User,
    ) {
        try {

            // Validate inputs
            if (!amount || amount <= 0) {
                throw new BadRequestException('Invalid amount');
            }
            if (!currency) {
                throw new BadRequestException('Currency is required');
            }
            const validTypes = ['card', 'paypal'];
            if (!validTypes.includes(paymentMethodType)) {
                throw new BadRequestException('Invalid payment method type');
            }
            if (!user || !user.id) {
                throw new BadRequestException('Invalid user');
            }

            // Check for existing customer ID or create a new one
            let customerId = user.stripeCustomerId;
            if (!customerId) {
                const customer = await this.stripe.customers.create({
                    email: user.email,
                    name: user.name,
                });
                customerId = customer.id;

                // Update user with Stripe customer ID
                await this.usersService.update(user.id, { stripeCustomerId: customerId });
            }

            const params: Stripe.PaymentIntentCreateParams = {
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                customer: customerId,
                payment_method_types: [paymentMethodType],
            };
            
            // // Handle different payment methods
            // if (paymentMethodType === 'card') {
            //     params.automatic_payment_methods = {
            //         enabled: true,
            //     };
            // } else {
            //     params.payment_method_types = [paymentMethodType];
            // }

            const paymentIntent = await this.stripe.paymentIntents.create(params);
            console.log(paymentIntent)

            const ephemeralKey = await this.stripe.ephemeralKeys.create(
                { customer: customerId },
                { apiVersion: '2025-03-31.basil' }
            );

            return {
                clientSecret: paymentIntent.client_secret,
                ephemeralSecret: ephemeralKey.secret,
                customerId: customerId,
                publishableKey: this.configService.get('STRIPE_PUBLISHABLE_KEY'),
            };
        } catch (error) {
            throw new Error(`Stripe error: ${error.message}`);
        }
    }
}
