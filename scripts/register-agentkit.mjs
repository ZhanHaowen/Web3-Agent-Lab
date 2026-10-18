// Match the production build's exact pinned SDK entry in source tests/dev too.
// Importing AgentKit's root eagerly loads unrelated third-party providers.
import { createRequire, registerHooks } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const entry = pathToFileURL(join(dirname(require.resolve('@coinbase/agentkit')), 'action-providers/actionProvider.js')).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === '@coinbase/agentkit' ? entry : specifier, context);
  },
});
