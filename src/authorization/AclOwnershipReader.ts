import { CredentialGroup } from '../authentication/Credentials';
import type { AccountSettings, AccountStore } from '../identity/interaction/email-password/storage/AccountStore';
import type { AuxiliaryIdentifierStrategy } from '../ldp/auxiliary/AuxiliaryIdentifierStrategy';
import type { AclPermission } from '../ldp/permissions/AclPermission';
import type { PermissionSet } from '../ldp/permissions/Permissions';
import type { PermissionReaderInput } from './PermissionReader';
import { PermissionReader } from './PermissionReader';

/**
 * Allows full access on ACL resources if the request is being made by the owner of the pod containing that resource.
 */
export class AclOwnershipReader extends PermissionReader {
  private readonly accountStore: AccountStore;
  private readonly aclStrategy: AuxiliaryIdentifierStrategy;

  public constructor(accountStore: AccountStore, aclStrategy: AuxiliaryIdentifierStrategy) {
    super();
    this.accountStore = accountStore;
    this.aclStrategy = aclStrategy;
  }

  public async handle({ credentials, identifier }: PermissionReaderInput): Promise<PermissionSet> {
    if (!this.aclStrategy.isAuxiliaryIdentifier(identifier)) {
      // Exception is only granted when accessing ACL resources
      return {};
    }
    if (!credentials.agent?.webId) {
      // Only authenticated agents are supported
      return {};
    }
    let settings: AccountSettings;
    try {
      settings = await this.accountStore.getSettings(credentials.agent.webId);
    } catch {
      // No account registered for this WebID
      return {};
    }
    if (!settings.podBaseUrl || !identifier.path.startsWith(settings.podBaseUrl)) {
      // Not targeting the pod owned by this agent or there is no pod at all
      return {};
    }

    return { [CredentialGroup.agent]: {
      read: true,
      write: true,
      append: true,
      create: true,
      delete: true,
      control: true,
    } as AclPermission };
  }
}
