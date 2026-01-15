import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import * as dotenv from 'dotenv';
import { PredictionHistoryService } from './prediction-history.service';

dotenv.config();

interface ModelApiResponse {
  prediction?: {
    label?: string;
    is_fake?: boolean;
    confidence?: number;
    scores?: {
      real?: number;
      fake?: number;
    };
  };
  result_image_url?: string;
  image_info?: {
    width?: number;
    height?: number;
    size_bytes?: number;
  };
  success?: boolean;
  error?: string;
  confidence?: number;
  label?: string;
}

@Injectable()
export class DetectionService {
  private readonly modelEndpoint = process.env.MODEL_API_URL || 'http://localhost:5001/predict';

  constructor(private readonly historyService: PredictionHistoryService) {}

  async analyze(file: Express.Multer.File) {
    const formData = new FormData();
    formData.append('image', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
      knownLength: file.size,
    });

    try {
      const { data } = await axios.post<ModelApiResponse>(this.modelEndpoint, formData, {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      const label = data?.prediction?.label ?? data?.label ?? '';
      const confidence = data?.prediction?.confidence ?? data?.confidence ?? 0;
      const isFake = String(label).toUpperCase() === 'FAKE';

      // Save to PostgreSQL history
      const savedRecord = await this.historyService.savePrediction({
        filename: file.originalname,
        prediction: label,
        confidence,
        is_fake: isFake,
        result_image_url: data?.result_image_url,
        image_width: data?.image_info?.width,
        image_height: data?.image_info?.height,
        image_size_bytes: data?.image_info?.size_bytes || file.size,
      });

      return {
        success: true,
        predictionId: savedRecord.id,
        label,
        isFake,
        confidence,
        scores: data?.prediction?.scores,
        imageInfo: data?.image_info,
        resultImageUrl: data?.result_image_url,
        createdAt: savedRecord.created_at,
        raw: data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 500;
        const message =
          (error.response?.data as { error?: string; message?: string })?.error ||
          (error.response?.data as { error?: string; message?: string })?.message ||
          'Model API request failed';

        if (status >= 400 && status < 500) {
          throw new BadRequestException(message);
        }

        throw new InternalServerErrorException(message);
      }

      throw new InternalServerErrorException('Detection failed');
    }
  }
}