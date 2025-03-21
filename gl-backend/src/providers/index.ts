import { Injectable } from '@nestjs/common';
import { GithubApi } from 'src/providers/github/github-api';
import { z } from 'zod';

export type Tokens = {
  access_token: string;
  refresh_token: string;
  expires_in: Date;
  refresh_token_expires_in: Date;
};

export const userInfoSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    login: z.string(),
    email: z.string(),
  })
  .required();

export type UserInfo = z.infer<typeof userInfoSchema>;

export const starredReposSchema = z
  .array(
    z.object({
      id: z.number(),
      full_name: z.string(),
      stargazers_count: z.number(),
      open_issues: z.number(),
      url: z.string().url(),
    }),
  )
  .optional()
  .default([]);

export type StarredRepos = z.infer<typeof starredReposSchema>;

export interface ServiceProvider {
  getProviderName(): string;
  login(code: string): Promise<Tokens>;
  refreshToken(refreshToken: string): Promise<Tokens>;
  getUserInfo(accessToken: string): Promise<UserInfo>;
  getStarredRepos(
    accessToken: string,
    page: number,
    perPage: number,
  ): Promise<{ data: StarredRepos; total: number }>;
  // getTotalCommitCount(
  //   accessToken: string,
  //   url: string,
  //   repo: string,
  // ): Promise<number>;
}

@Injectable()
export class ServicesProviderFactory {
  private readonly providers: Record<string, ServiceProvider>;

  constructor(githubApi: GithubApi) {
    this.providers = {
      github: githubApi,
    };
  }

  getProvider(providerName: string): ServiceProvider {
    return this.providers[providerName];
  }
}
