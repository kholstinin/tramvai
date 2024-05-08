import noop from '@tinkoff/utils/function/noop';
import type { EnvParameter } from '@tramvai/tokens-common';
import { EnvironmentManager } from '../shared/EnvironmentManager';
import { ClientEnvironmentRepository } from './ClientEnvironmentRepository';

const readFileWithEnv = (path: string) => {
  try {
    const requireFunc =
      // @ts-ignore
      typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require;

    return requireFunc(path);
  } catch (e) {
    return {};
  }
};

export class EnvironmentManagerServer extends EnvironmentManager {
  private clientEnvRepository: ClientEnvironmentRepository;

  constructor(private tokens: EnvParameter[]) {
    super();
    this.processing();
    // for backward compatibility
    this.clientEnvRepository = new ClientEnvironmentRepository(this, this.tokens);
  }

  /**
   * @deprecated use CLIENT_ENV_MANAGER_TOKEN
   */
  clientUsed() {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(
        'Method ENV_MANAGER_TOKEN.clientUsed is deprecated, use CLIENT_ENV_MANAGER_TOKEN.getAll instead'
      );
    }
    return this.clientEnvRepository.getAll();
  }

  /**
   * @deprecated use CLIENT_ENV_MANAGER_TOKEN
   */
  updateClientUsed(result: Record<string, string>) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(
        'Method ENV_MANAGER_TOKEN.updateClientUsed is deprecated, use CLIENT_ENV_MANAGER_TOKEN.update instead'
      );
    }
    this.clientEnvRepository.update(result);
  }

  // eslint-disable-next-line class-methods-use-this
  private getEnvInFiles() {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.DANGEROUS_UNSAFE_ENV_FILES !== 'true'
    ) {
      return {};
    }

    const path = require('path');
    return {
      ...readFileWithEnv(path.resolve(process.cwd(), 'server', `env.js`)), // env.js убрать в будущем, как переедет платформа
      ...readFileWithEnv(path.resolve(process.cwd(), `env.development.js`)),
      ...readFileWithEnv(path.resolve(process.cwd(), `env.js`)),
    };
  }

  private getEnvInApp() {
    const appValue: Record<string, string> = {};
    this.tokens.forEach((token) => {
      if (token.value !== undefined) {
        appValue[token.key] = token.value;
      }
    });
    return appValue;
  }

  private collectionEnv(): Record<string, string> {
    return { ...this.getEnvInApp(), ...this.getEnvInFiles(), ...process.env };
  }

  private processing() {
    const result: Record<string, string> = {};
    const envParameters = this.collectionEnv();

    this.tokens.forEach(({ key, validator = noop, optional }) => {
      const value = envParameters[key];

      if (typeof value === 'undefined' && !optional) {
        throw new Error(
          `Env parameter ${key} not found. You need add a this env parameter. If you have questions read the docs`
        );
      }

      // Not calling validation on empty values.
      const validation = typeof value !== 'undefined' && validator(value);
      if (typeof validation === 'string') {
        throw new Error(
          `Env parameter ${key} with value ${value} not valid, message: ${validation}`
        );
      }

      result[key] = value;
    });

    // sync process.env
    process.env = envParameters;

    this.update(result);
  }
}
