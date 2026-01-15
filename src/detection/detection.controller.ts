import { BadRequestException, Controller, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DetectionService } from './detection.service';
import { PredictionHistoryService } from './prediction-history.service';

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/bmp',
]);

@Controller('detection')
export class DetectionController {
  constructor(
    private readonly detectionService: DetectionService,
    private readonly historyService: PredictionHistoryService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES },
      storage: memoryStorage(),
    }),
  )
  async detect(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file type');
    }

    return this.detectionService.analyze(file);
  }

  @Get('history')
  async getHistory(@Query('limit') limit: string = '10') {
    return this.historyService.getRecentPredictions(Math.min(parseInt(limit) || 10, 100));
  }

  @Get('history/:id')
  async getPredictionById(@Param('id') id: string) {
    const prediction = await this.historyService.getPredictionById(parseInt(id));
    if (!prediction) {
      throw new BadRequestException('Prediction not found');
    }
    return prediction;
  }

  @Get('history/by-label/:label')
  async getPredictionsByLabel(
    @Param('label') label: string,
    @Query('limit') limit: string = '10',
  ) {
    const validLabel = label.toUpperCase() as 'FAKE' | 'REAL';
    if (!['FAKE', 'REAL'].includes(validLabel)) {
      throw new BadRequestException('Label must be FAKE or REAL');
    }
    return this.historyService.getPredictionsByLabel(validLabel, Math.min(parseInt(limit) || 10, 100));
  }

  @Get('statistics')
  async getStatistics() {
    return this.historyService.getStatistics();
  }
}