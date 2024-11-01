import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // @Post('create-payment-session')
  @MessagePattern({ cmd : 'create.payment.session'})
  createPayment(
    @Payload() paymentSessionDto: PaymentSessionDto
  ) {
    return this.paymentsService.createPayment(paymentSessionDto);
  }

  @Get('success')
  async success() {
    return await this.paymentsService.success();
  }

  @Get('fail')
  async fail() {
    return await this.paymentsService.fail();
  }

  @Get('cancel')
  async cancel() {
    return await this.paymentsService.cancel();
  }

  @Post('webhook')
  async webhook(@Req() req: Request, @Res() res: Response ) {
    return await this.paymentsService.stripeWebhook(req, res);
  }

}
