import { Module } from '@nestjs/common';
import { DetectionController } from './detection.controller';
import { DetectionService } from './detection.service';
import { PredictionHistoryService } from './prediction-history.service';

@Module({
  controllers: [DetectionController],
  providers: [DetectionService, PredictionHistoryService],
})
export class DetectionModule {}