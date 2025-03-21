import { CookieTokenGuard } from './cookie-token.guard';

describe('CookieTokenGuard', () => {
  it('should be defined', () => {
    expect(new CookieTokenGuard()).toBeDefined();
  });
});
