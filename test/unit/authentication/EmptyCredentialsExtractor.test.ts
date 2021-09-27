import { CredentialGroup } from '../../../src/authentication/Credentials';
import { EmptyCredentialsExtractor } from '../../../src/authentication/EmptyCredentialsExtractor';
import type { HttpRequest } from '../../../src/server/HttpRequest';

describe('An EmptyCredentialsExtractor', (): void => {
  const extractor = new EmptyCredentialsExtractor();

  it('returns the empty credentials.', async(): Promise<void> => {
    const headers = {};
    const result = extractor.handleSafe({ headers } as HttpRequest);
    await expect(result).resolves.toEqual({ [CredentialGroup.public]: {}});
  });
});
