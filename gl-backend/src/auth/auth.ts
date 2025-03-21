import { Injectable } from '@nestjs/common';
import * as jose from 'jose';
import { ConfigService } from 'src/configs/configuration';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  async signJwt(email: string): Promise<string> {
    const { JWT_SECRET } = this.configService.config;
    const secret = new TextEncoder().encode(JWT_SECRET);
    return await new jose.SignJWT({ email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);
  }

  async verifyJwt(token: string): Promise<string> {
    const { JWT_SECRET } = this.configService.config;
    const secret = new TextEncoder().encode(JWT_SECRET);
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      return payload.email as string;
    } catch {
      throw new Error('Invalid token');
    }
  }
}
