// src/stripe/stripe.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  @Post('create-payment-intent')
  async createPaymentIntent(@Body() body: {
    amount: number,
    currency: string,
    payment_method_type: string
  }) {
    return this.stripeService.createPaymentIntent(
      body.amount,
      body.currency,
      body.payment_method_type
    );
  }
}