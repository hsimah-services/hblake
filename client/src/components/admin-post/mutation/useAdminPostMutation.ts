import { graphql } from 'react-relay';
import { useMutationAction } from '@tsquid/routes/mutation';
import { useContentMutation, type useContentMutationOperation } from '../../../relay/useContentMutation';

const CREATE = graphql`mutation AdminPostCreateMutation($input: CreatePostInput!) { createPost(input: $input) { post { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const UPDATE = graphql`mutation AdminPostUpdateMutation($input: UpdatePostInput!) { updatePost(input: $input) { post { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const PUBLISH = graphql`mutation AdminPostPublishMutation($input: PublishPostInput!) { publishPost(input: $input) { post { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const UNPUBLISH = graphql`mutation AdminPostUnpublishMutation($input: UnpublishPostInput!) { unpublishPost(input: $input) { post { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const DELETE = graphql`mutation AdminPostDeleteMutation($input: DeletePostInput!) { deletePost(input: $input) { deletedId } }`;

export function useAdminPostMutation() {
  const [create] = useMutationAction<useContentMutationOperation>(CREATE);
  const [update] = useMutationAction<useContentMutationOperation>(UPDATE);
  const [publish] = useMutationAction<useContentMutationOperation>(PUBLISH);
  const [unpublish] = useMutationAction<useContentMutationOperation>(UNPUBLISH);
  const [remove] = useMutationAction<useContentMutationOperation>(DELETE);
  return useContentMutation({ create, update, publish, unpublish, delete: remove });
}
