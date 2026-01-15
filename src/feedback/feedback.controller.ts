import { Controller, Post, Get, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async createFeedback(
    @Headers('authorization') authorization: string,
    @Body() body: { message: string }
  ) {
    if (!authorization) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authorization.replace('Bearer ', '');
    return this.feedbackService.createFeedback(token, body.message);
  }

  @Get()
  async getAllFeedback() {
    return this.feedbackService.getAllFeedback();
  }
}
