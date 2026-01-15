import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import pool from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

@Injectable()
export class FeedbackService {
  async createFeedback(token: string, message: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as unknown as { sub: number; username: string };
      
      const result = await pool.query(
        'INSERT INTO feedback (user_id, message, created_at) VALUES ($1, $2, NOW()) RETURNING id, message, created_at',
        [decoded.sub, message]
      );
      
      const feedback = result.rows[0];
      return {
        id: feedback.id,
        message: feedback.message,
        created_at: feedback.created_at,
        username: decoded.username,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getAllFeedback() {
    const result = await pool.query(
      `SELECT f.id, f.message, f.created_at, u.username 
       FROM feedback f 
       JOIN users u ON f.user_id = u.id 
       ORDER BY f.created_at DESC 
       LIMIT 50`
    );
    
    return result.rows.map(row => ({
      id: row.id,
      username: row.username,
      message: row.message,
      timestamp: this.formatTimestamp(row.created_at),
    }));
  }

  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just sent';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(date).toLocaleDateString();
  }
}
