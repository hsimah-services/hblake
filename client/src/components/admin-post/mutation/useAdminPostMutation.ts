import { graphql } from 'react-relay';
import { useContentMutation } from '../../../relay/useContentMutation';

const CREATE = graphql`mutation AdminPostCreateMutation($input: CreatePostInput!) { createPost(input: $input) { post { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const UPDATE = graphql`mutation AdminPostUpdateMutation($input: UpdatePostInput!) { updatePost(input: $input) { post { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const PUBLISH = graphql`mutation AdminPostPublishMutation($input: PublishPostInput!) { publishPost(input: $input) { post { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const UNPUBLISH = graphql`mutation AdminPostUnpublishMutation($input: UnpublishPostInput!) { unpublishPost(input: $input) { post { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const DELETE = graphql`mutation AdminPostDeleteMutation($input: DeletePostInput!) { deletePost(input: $input) { deletedId } }`;
const OPERATIONS = { create: CREATE, update: UPDATE, publish: PUBLISH, unpublish: UNPUBLISH, delete: DELETE };

export function useAdminPostMutation() { return useContentMutation(OPERATIONS); }
