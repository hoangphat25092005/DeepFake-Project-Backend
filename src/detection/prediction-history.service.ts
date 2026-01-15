import { Injectable } from '@nestjs/common';
import pool from '../db';

interface PredictionRecord {
  filename: string;
  prediction: string;
  confidence: number;
  is_fake: boolean;
  result_image_url?: string;
  image_width?: number;
  image_height?: number;
  image_size_bytes?: number;
  user_id?: number;
}

@Injectable()
export class PredictionHistoryService {
  async savePrediction(data: PredictionRecord & { user_id?: number }) {
    try {
      const result = await pool.query(
        `INSERT INTO predictions 
         (filename, prediction, confidence, is_fake, result_image_url, image_width, image_height, image_size_bytes, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, filename, prediction, confidence, created_at`,
        [
          data.filename,
          data.prediction,
          data.confidence,
          data.is_fake,
          data.result_image_url,
          data.image_width,
          data.image_height,
          data.image_size_bytes,
          data.user_id || null,
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error saving prediction to database:', error);
      throw error;
    }
  }

  async getRecentPredictions(limit: number = 10, userId?: number) {
    try {
      let query =
        'SELECT * FROM predictions ORDER BY created_at DESC LIMIT $1';
      let params: any[] = [limit];

      if (userId) {
        query =
          'SELECT * FROM predictions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2';
        params = [userId, limit];
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching predictions:', error);
      throw error;
    }
  }

  async getPredictionById(id: number) {
    try {
      const result = await pool.query(
        'SELECT * FROM predictions WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching prediction by ID:', error);
      throw error;
    }
  }

  async getPredictionsByLabel(label: 'FAKE' | 'REAL', limit: number = 10) {
    try {
      const result = await pool.query(
        'SELECT * FROM predictions WHERE prediction = $1 ORDER BY created_at DESC LIMIT $2',
        [label, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching predictions by label:', error);
      throw error;
    }
  }

  async getStatistics() {
    try {
      const result = await pool.query('SELECT * FROM prediction_stats');
      return result.rows[0] || {
        total_predictions: 0,
        fake_count: 0,
        real_count: 0,
        avg_confidence: 0,
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }
}
