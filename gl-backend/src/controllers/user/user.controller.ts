import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Email } from 'src/decorators/email-decorator';
import { CookieTokenGuard } from 'src/guards/cookie-token/cookie-token.guard';
import { CommitCounts } from 'src/models/commit-model';
import { Credential } from 'src/models/credential-model';
import { Repo } from 'src/models/repo-model';
import { ServicesProviderFactory, StarredRepos } from 'src/providers';
import { Repository } from 'typeorm';

@UseGuards(CookieTokenGuard)
@Controller('user')
export class UserController {
  constructor(
    @InjectRepository(Repo)
    private readonly repos: Repository<Repo>,
    @InjectRepository(CommitCounts)
    private readonly commits: Repository<CommitCounts>,
    @InjectRepository(Credential)
    private readonly credentials: Repository<Credential>,
    private readonly serviceProviderFactory: ServicesProviderFactory,
  ) {}

  @Get()
  async getUser(
    @Email() email: string,
    @Query('provider') providerName: string,
    @Query('page') page: string,
  ): Promise<any> {
    const provider = this.serviceProviderFactory.getProvider(providerName);
    if (!provider) {
      throw new NotFoundException('Service provider not found');
    }

    const credentials = await this.credentials.findOne({
      where: { user: { email }, provider: provider.getProviderName() },
    });

    if (!credentials) {
      throw new UnauthorizedException('Credentials not found');
    }

    if (credentials.refreshTokenExpiresAt < new Date()) {
      throw new ForbiddenException('Credentials expired');
    } else if (credentials.expiresAt < new Date()) {
      const newCredentials = await provider.refreshToken(
        credentials.refreshToken,
      );
      if (!newCredentials) {
        throw new ForbiddenException('Credentials expired');
      }
      await this.credentials.save({
        ...credentials,
        accessToken: newCredentials.access_token,
        refreshToken: newCredentials.refresh_token,
        expiresAt: new Date(
          Date.now() + newCredentials.expires_in.getTime() * 1000,
        ),
        refreshTokenExpiresAt: new Date(
          Date.now() + newCredentials.refresh_token_expires_in.getTime() * 1000,
        ),
      });
      credentials.accessToken = newCredentials.access_token;
      credentials.refreshToken = newCredentials.refresh_token;
    }
    const [userInfo, starredRepos] = await Promise.all([
      provider.getUserInfo(credentials.accessToken),
      provider.getStarredRepos(credentials.accessToken, Number(page), 5),
    ]);

    starredRepos.data.forEach((repo) => {
      void this.sync(repo);
    });

    for (const repo of starredRepos.data) {
      const daysAgo = 30;
      const commits = (
        await this.commits.find({
          where: {
            repo: { full_name: repo.full_name },
          },
          order: { date: 'ASC' },
          take: daysAgo,
        })
      ).map((commit) => ({ date: commit.date, count: commit.commit_count }));
      //@ts-expect-error Adding a new property to the repo object
      repo.commits = commits;
    }

    return {
      userInfo,
      starredRepos: starredRepos.data,
      page: Number(page),
      total: starredRepos.total,
    };
  }

  async sync(repo: StarredRepos[number]) {
    if (
      await this.repos.exists({
        where: { url: repo.url, full_name: repo.full_name },
      })
    ) {
      return;
    }
    void this.repos.save({
      url: repo.url,
      full_name: repo.full_name,
    });
  }
}
