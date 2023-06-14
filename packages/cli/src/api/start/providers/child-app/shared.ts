import type { Provider } from '@tinkoff/dippy';
import { provide } from '@tinkoff/dippy';
import { CLOSE_HANDLER_TOKEN, INIT_HANDLER_TOKEN } from '../../tokens';
import {
  CONFIG_MANAGER_TOKEN,
  CONFIG_ENTRY_TOKEN,
  COMMAND_PARAMETERS_TOKEN,
  STATIC_SERVER_TOKEN,
} from '../../../../di/tokens';
import type { ChildAppConfigEntry } from '../../../../typings/configEntry/child-app';
import { closeWorkerPoolTranspiler } from '../../../../library/webpack/utils/workersPool';
import { stopServer } from '../../utils/stopServer';
import { createServer } from '../../utils/createServer';
import { listenServer } from '../../utils/listenServer';
import { createConfigManager, DEFAULT_STATIC_MODULE_PORT } from '../../../../config/configManager';
import { detectPortSync } from '../../../../utils/detectPortSync';

export const sharedProviders: readonly Provider[] = [
  provide({
    provide: CONFIG_MANAGER_TOKEN,
    useFactory: ({ configEntry, parameters }) =>
      createConfigManager(configEntry as ChildAppConfigEntry, {
        ...parameters,
        appEnv: parameters.env,
        env: 'development',
        port: detectPortSync({ request: parameters.port, fallback: DEFAULT_STATIC_MODULE_PORT }),
      }),
    deps: {
      configEntry: CONFIG_ENTRY_TOKEN,
      parameters: COMMAND_PARAMETERS_TOKEN,
    },
  }),
  provide({
    provide: STATIC_SERVER_TOKEN,
    useFactory: createServer,
  }),
  provide({
    provide: INIT_HANDLER_TOKEN,
    multi: true,
    useFactory: ({ staticServer, configManager }) => {
      return async function staticServerListen() {
        const { host, port } = configManager;

        await listenServer(staticServer, host, port);
      };
    },
    deps: {
      staticServer: STATIC_SERVER_TOKEN,
      configManager: CONFIG_MANAGER_TOKEN,
    },
  }),
  provide({
    provide: CLOSE_HANDLER_TOKEN,
    multi: true,
    useFactory: ({ staticServer }) => {
      return () => {
        return stopServer(staticServer);
      };
    },
    deps: {
      staticServer: STATIC_SERVER_TOKEN,
    },
  }),
  provide({
    provide: CLOSE_HANDLER_TOKEN,
    multi: true,
    useFactory: ({ configManager }) => {
      return async () => {
        await closeWorkerPoolTranspiler(configManager);
      };
    },
    deps: {
      configManager: CONFIG_MANAGER_TOKEN,
    },
  }),
] as const;
