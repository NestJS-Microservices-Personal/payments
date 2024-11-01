import { Inject, Injectable } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { NATS_SERVICE } from 'src/config';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(
    envs.stripeSecret
  )
  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy
  ) {}

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
        },
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    });
    return {
      id: session.id,
      cancelUrl: session.cancel_url,
      successUrl: session.success_url,
      paymentUrl: session.url,
    };
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
        const payload = {
          stripePaymentId: paymentIntent.id,
          orderId: paymentIntent.metadata.orderId,
          receiptUrl: paymentIntent.receipt_url,
        }
        this.client.emit({ cmd: 'order.payment.success' }, payload)
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    return res.status(200).json({ sig });

  }
}
