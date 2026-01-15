
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FeedbackModule } from './feedback/feedback.module';
import { DetectionModule } from './detection/detection.module';

@Module({
  imports: [AuthModule, FeedbackModule, DetectionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
