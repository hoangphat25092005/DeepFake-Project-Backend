
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import pool from '../db';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

@Injectable()
export class AuthService {
  async login({ email, password }: { email: string; password: string }) {
    // Query user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) throw new UnauthorizedException('Invalid credentials');
    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');
    const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    return { token, user: { username: user.username, email: user.email } };
  }

  async register({ username, email, password }: { username: string; email: string; password: string }) {
    // Check if email exists
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if ((exists.rowCount || 0) > 0) throw new BadRequestException('Email already exists');
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    // Insert user
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashed]
    );
    const user = result.rows[0];
    const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    return { token, user };
  }

  async getMe(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as unknown as { sub: number; username: string };
      const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [decoded.sub]);
      const user = result.rows[0];
      if (!user) throw new UnauthorizedException('User not found');
      return { username: user.username, email: user.email, id: user.id };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
