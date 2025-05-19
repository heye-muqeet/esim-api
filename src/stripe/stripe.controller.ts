import { Body, Controller, Post, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
import { User } from '../typeorm/entities/user.entity';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly usersService: UsersService,
  ) {}

  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(
    @Req() req: Request,
    @Body() body: { amount: number; currency: string; payment_method_type: string },
  ) {
    console.log('req.user:', req.user); // Debug log
    const user = req.user as User;
    if (!user || !user.id) {
      console.error('Invalid user authentication:', { user });
      throw new BadRequestException('Invalid user authentication');
    }

    // Verify user exists
    const dbUser = await this.usersService.findOne(user.id);
    if (!dbUser) {
      console.error('User not found in database:', { userId: user.id });
      throw new BadRequestException('User not found');
    }

    return this.stripeService.createPaymentIntent(
      body.amount,
      body.currency,
      body.payment_method_type,
      dbUser,
    );
  }
}