import { Module } from '@nestjs/common';
import { HealthCheckController } from './controllers/health-check/health-check.controller';
import { LoginController } from './controllers/login/login.controller';
import { ConfigService } from './configs/configuration';
import { UserController } from './controllers/user/user.controller';
import { GithubApi } from './providers/github/github-api';
import { ServicesProviderFactory } from './providers';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './models/user-model';
import { Credential } from './models/credential-model';
import { AuthService } from './auth/auth';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { CommitCounts } from './models/commit-model';
import { Repo } from './models/repo-model';
import { LogoutController } from './controllers/logout/logout.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      // Can be configured for distributed Limiting with Redis
      throttlers: [
        {
          ttl: 60000,
          limit: 20,
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [AppModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.config.DB_HOST,
        port: configService.config.DB_PORT,
        username: configService.config.DB_USERNAME,
        password: configService.config.DB_PASSWORD,
        database: configService.config.DB_NAME,
        entities: [User, Credential, CommitCounts, Repo],
        synchronize: true,
        logging: 'all',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Credential, CommitCounts, Repo]),
  ],
  controllers: [
    HealthCheckController,
    LoginController,
    UserController,
    LogoutController,
  ],
  providers: [
    ConfigService,
    GithubApi,
    ServicesProviderFactory,
    AuthService,
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    },
  ],
  exports: [ConfigService],
})
export class AppModule {}
