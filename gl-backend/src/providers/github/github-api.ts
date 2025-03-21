import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from 'src/configs/configuration';
import { CommitCounts } from 'src/models/commit-model';
import { Repo } from 'src/models/repo-model';
import {
  ServiceProvider,
  starredReposSchema,
  Tokens,
  UserInfo,
  userInfoSchema,
} from 'src/providers';
import { findMaxFromLinkHeader } from 'src/util/pagination';
import { Repository } from 'typeorm';

@Injectable()
export class GithubApi implements ServiceProvider {
  private static readonly GITHUB_API_URL = 'https://api.github.com';
  private static readonly GITHUB_USER_ENDPOINT = '/user';
  private static readonly GITHUB_STARRED_ENDPOINT = '/user/starred';

  constructor(
    @InjectRepository(Repo)
    private readonly repos: Repository<Repo>,
    private readonly configService: ConfigService,
  ) {}

  getProviderName(): string {
    return 'github';
  }

  async login(code: string): Promise<Tokens> {
    const { CLIENT_ID, CLIENT_SECRET } = this.configService.config;
    const url = new URL('/login/oauth/access_token', 'https://github.com');

    url.searchParams.append('client_id', CLIENT_ID);
    url.searchParams.append('client_secret', CLIENT_SECRET);
    url.searchParams.append('code', code);

    return this.explodeTokens(url);
  }

  async refreshToken(refreshToken: string): Promise<Tokens> {
    const { CLIENT_ID, CLIENT_SECRET } = this.configService.config;
    const url = new URL('/login/oauth/access_token', 'https://github.com');

    url.searchParams.append('client_id', CLIENT_ID);
    url.searchParams.append('client_secret', CLIENT_SECRET);
    url.searchParams.append('grant_type', 'refresh_token');
    url.searchParams.append('refresh_token', refreshToken);

    return this.explodeTokens(url);
  }

  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch(
      GithubApi.GITHUB_API_URL + GithubApi.GITHUB_USER_ENDPOINT,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Failed to fetch user data from GitHub',
      );
    }

    const data = await userInfoSchema.parseAsync(await response.json());
    return data;
  }

  async getStarredRepos(accessToken: string, page: number, perPage: number) {
    const url = new URL(
      GithubApi.GITHUB_STARRED_ENDPOINT,
      GithubApi.GITHUB_API_URL,
    );
    url.searchParams.append('page', page.toString());
    url.searchParams.append('per_page', perPage.toString());
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Failed to fetch starred repos from GitHub',
      );
    }

    const max = findMaxFromLinkHeader(response.headers.get('Link') ?? '');

    const data = await starredReposSchema.parseAsync(await response.json());
    return { data, total: max };
  }

  async explodeTokens(url: URL): Promise<Tokens> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new InternalServerErrorException();
    }

    const data = new URLSearchParams(await response.text());

    const access_token = data.get('access_token');
    const refresh_token = data.get('refresh_token');
    const expiresIn = data.get('expires_in');
    const refresh_token_expires_in = data.get('refresh_token_expires_in');
    if (
      !access_token ||
      !refresh_token ||
      !expiresIn ||
      !refresh_token_expires_in
    ) {
      throw new ForbiddenException(
        data.get('error_description') || 'Invalid response from GitHub',
      );
    }
    return {
      access_token,
      refresh_token,
      expires_in: new Date(Date.now() + Number(expiresIn) * 1000),
      refresh_token_expires_in: new Date(
        Date.now() + Number(refresh_token_expires_in) * 1000,
      ),
    };
  }

  @Cron('0 * * * *') // Every hour
  async updateCommits() {
    let more = true;
    while (more) {
      await this.repos.manager.transaction(
        'SERIALIZABLE',
        async (transactionEntityManager) => {
          const qb = transactionEntityManager
            .createQueryBuilder(Repo, 'repo')
            .setLock('pessimistic_write')
            .setOnLocked('skip_locked')
            .where(
              "last_scanned < now() - interval '1 day' or last_scanned is null",
            );
          const repo = await qb.getOne();
          if (!repo) {
            console.log('No repos to update');
            more = false;
            return;
          }
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);
          const commitsCount = await this.getTotalCommitSince(today, repo.url);
          const commits = transactionEntityManager.getRepository(CommitCounts);
          await commits.save({
            repo,
            date: today,
            commit_count: commitsCount,
          });
          await transactionEntityManager.getRepository(Repo).update(
            { id: repo.id },
            {
              last_scanned: today,
            },
          );
        },
      );
    }
  }

  async getTotalCommitSince(date: Date, url: string): Promise<number> {
    // const auth = createAppAuth({
    //   appId: 1181564,
    //   privateKey: this.configService.config.PRIVATE_KEY,
    //   clientId: this.configService.config.CLIENT_ID,
    //   clientSecret: this.configService.config.CLIENT_SECRET,
    // });

    // const { token } = await auth({ type: 'app' });

    const searchParams = new URLSearchParams();
    searchParams.append('per_page', '1');
    searchParams.append('page', '1');
    // searchParams.append('since', date.toISOString());
    const response = await fetch(`${url}/commits?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.configService.config.PRIVATE_ACCESS_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!response.ok) {
      throw new InternalServerErrorException(
        'Failed to fetch commit count from GitHub',
      );
    }
    const linkHeader = response.headers.get('Link') ?? '';

    const max = findMaxFromLinkHeader(linkHeader);

    return max;
  }
}
