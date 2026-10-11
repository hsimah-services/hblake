import { graphql } from 'react-relay';
import { useMutationAction } from '@tsquid/routes/mutation';

const CREATE = graphql`mutation AdminPageCreateMutation($input: CreatePageInput!) { createPage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const UPDATE = graphql`mutation AdminPageUpdateMutation($input: UpdatePageInput!) { updatePage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const PUBLISH = graphql`mutation AdminPagePublishMutation($input: PublishPageInput!) { publishPage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const UNPUBLISH = graphql`mutation AdminPageUnpublishMutation($input: UnpublishPageInput!) { unpublishPage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const DELETE = graphql`mutation AdminPageDeleteMutation($input: DeletePageInput!) { deletePage(input: $input) { deletedId } }`;

export function useAdminPageMutation() {
  const [create] = useMutationAction<Mutation>(CREATE);
  const [update] = useMutationAction<Mutation>(UPDATE);
  const [publish] = useMutationAction<Mutation>(PUBLISH);
  const [unpublish] = useMutationAction<Mutation>(UNPUBLISH);
  const [remove] = useMutationAction<Mutation>(DELETE);
  const operations: Record<string, typeof update> = { create, update, publish, unpublish, delete: remove };
  return (action: string, input: Record<string, unknown>) => {
    const commit = operations[action];
    if (!commit) return Promise.reject(new Error('Unsupported content operation.'));
    return commit({ variables: { input } });
  };
}

type Mutation = { response: Record<string, unknown>; variables: { input: Record<string, unknown> } };
