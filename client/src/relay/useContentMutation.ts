import type { useMutationAction } from '@tsquid/routes/mutation';

// Tsquid commits handle pending promises; successful writes invalidate cached route queries.
export function useContentMutation(operations: Record<string, MutationAction>) {
  return async (action: string, input: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const commit = operations[action];
    if (!commit) throw new Error('Unsupported content operation.');
    return commit({ variables: { input }, updater: store => { store.invalidateStore(); } });
  };
}

export type useContentMutationOperation = { response: Record<string, unknown>; variables: { input: Record<string, unknown> } };
type MutationAction = ReturnType<typeof useMutationAction<useContentMutationOperation>>[0];
