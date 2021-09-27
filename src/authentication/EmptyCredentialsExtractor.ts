import { CredentialGroup } from './Credentials';
import type { CredentialSet } from './Credentials';
import { CredentialsExtractor } from './CredentialsExtractor';

/**
 * Extracts the empty credentials, indicating an unauthenticated agent.
 */
export class EmptyCredentialsExtractor extends CredentialsExtractor {
  public async handle(): Promise<CredentialSet> {
    return { [CredentialGroup.public]: {}};
  }
}
