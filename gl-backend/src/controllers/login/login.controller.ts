import { Body, Controller, Post, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { AuthService } from 'src/auth/auth';
import { LoginDto } from 'src/dto/login-dto';
import { Credential } from 'src/models/credential-model';
import { User } from 'src/models/user-model';
import { ServicesProviderFactory } from 'src/providers';
import { Repository } from 'typeorm';

@Controller('login')
export class LoginController {
  constructor(
    @InjectRepository(Credential)
    private readonly credentials: Repository<Credential>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly serviceProviderFactory: ServicesProviderFactory,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async login(@Body() loginDto: LoginDto, @Res() res: Response): Promise<void> {
    const { code } = loginDto;

    const {
      access_token,
      refresh_token,
      expires_in,
      refresh_token_expires_in,
    } = await this.serviceProviderFactory.getProvider('github').login(code);

    const userInfo = await this.serviceProviderFactory
      .getProvider('github')
      .getUserInfo(access_token);

    const user = await this.users.findOne({
      where: { email: userInfo.email },
    });

    if (!user) {
      const newUser = await this.users.save({
        email: userInfo.email,
      });
      await this.credentials.save({
        user: newUser,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_in,
        provider: 'github',
        refreshTokenExpiresAt: refresh_token_expires_in,
      });
    } else {
      await this.credentials.update(
        {
          user: user,
        },
        {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: expires_in,
          refreshTokenExpiresAt: refresh_token_expires_in,
        },
      );
    }

    res.cookie('token', await this.authService.signJwt(userInfo.email), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expires_in.getTime() - Date.now(),
    });
    res.status(201).end();
  }
}
