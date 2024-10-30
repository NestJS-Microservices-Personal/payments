import { Injectable } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import e, { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(
    envs.stripeSecret
  )

  async createPayment(paymentSessionDto: PaymentSessionDto) {

    const { currency, items, orderId } = paymentSessionDto;

    const lineItems = items.map(item => {
      return {
        price_data: {
          currency: currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price),
        },
        quantity: item.quantity,
      }
    })

    const session = await this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: {
          orderId,
          // integration_check: 'accept_a_payment',
        },
      },
      // payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    });
    return session;
  }

  async success() {
    return {
      ok: true,
      message: 'Payment successful',
      data: {
        amount: 1000,
        currency: 'USD',
        transactionId: '1234567890',
      }
    }
  }

  async fail() {
    return {
      ok: false,
      message: 'Payment failed',
      data: {
        amount: 1000,
        currency: 'USD',
        transactionId: '1234567890',
      }
    }
  }

  async cancel() {
    return {
      ok: false,
      message: 'Payment cancelled',
      data: {
        amount: 1000,
        currency: 'USD',
        transactionId: '1234567890',
      }
    }
  }

  async stripeWebhook( req: Request, res: Response ) {
    const sig = req.headers['stripe-signature'];
    
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        envs.stripeWebhookSecret
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return
    }

    switch (event.type) {
      case 'charge.succeeded':
        const paymentIntent = event.data.object
        console.log({
          metadata: paymentIntent.metadata,
          orderId: paymentIntent.metadata.orderId,
        });
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    return res.status(200).json({ sig });

  }
}
