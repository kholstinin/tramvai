import type { Provider } from '@tramvai/core';
import {
  COMMAND_LINE_RUNNER_PLUGIN,
  COMMAND_LINES_TOKEN,
  Scope,
  TAPABLE_HOOK_FACTORY_TOKEN,
} from '@tramvai/core';
import { COMMAND_LINE_RUNNER_TOKEN } from '@tramvai/core';
import { provide } from '@tramvai/core';
import {
  CHILD_APP_INTERNAL_ROOT_DI_BORROW_TOKEN,
  commandLineListTokens,
} from '@tramvai/tokens-child-app';
import {
  COMMAND_LINE_EXECUTION_CONTEXT_TOKEN,
  EXECUTION_CONTEXT_MANAGER_TOKEN,
} from '@tramvai/tokens-common';

const command = {
  customer: [
    commandLineListTokens.customerStart,
    commandLineListTokens.resolveUserDeps,
    commandLineListTokens.resolvePageDeps,
  ],
  clear: [commandLineListTokens.clear],
  spa: [
    commandLineListTokens.resolveUserDeps,
    commandLineListTokens.resolvePageDeps,
    commandLineListTokens.spaTransition,
  ],
  afterSpa: [commandLineListTokens.afterSpaTransition],
};

export const lines = {
  server: command,
  client: command,
};

export const commandProviders: Provider[] = [
  provide({
    provide: CHILD_APP_INTERNAL_ROOT_DI_BORROW_TOKEN,
    multi: true,
    useValue: [
      COMMAND_LINE_RUNNER_TOKEN,
      EXECUTION_CONTEXT_MANAGER_TOKEN,
      COMMAND_LINE_EXECUTION_CONTEXT_TOKEN,
      TAPABLE_HOOK_FACTORY_TOKEN,
      COMMAND_LINE_RUNNER_PLUGIN,
    ],
  }),
  provide({
    provide: COMMAND_LINES_TOKEN,
    scope: Scope.SINGLETON,
    useValue: lines,
  }),
];
