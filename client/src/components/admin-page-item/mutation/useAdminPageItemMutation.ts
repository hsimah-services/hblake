import { graphql } from 'react-relay';
import { useMutationAction } from '@tsquid/routes/mutation';
import { useContentMutation, type useContentMutationOperation } from '../../../relay/useContentMutation';

const CREATE = graphql`mutation AdminPageItemCreateMutation($input: CreatePageItemInput!) { createPageItem(input: $input) { pageItem { id title slug content excerpt status publishedAt createdAt updatedAt kind enquiryUrl } } }`;
const UPDATE = graphql`mutation AdminPageItemUpdateMutation($input: UpdatePageItemInput!) { updatePageItem(input: $input) { pageItem { id title slug content excerpt status publishedAt createdAt updatedAt kind enquiryUrl } } }`;
const PUBLISH = graphql`mutation AdminPageItemPublishMutation($input: PublishPageItemInput!) { publishPageItem(input: $input) { pageItem { id title slug content excerpt status publishedAt createdAt updatedAt kind enquiryUrl } } }`;
const UNPUBLISH = graphql`mutation AdminPageItemUnpublishMutation($input: UnpublishPageItemInput!) { unpublishPageItem(input: $input) { pageItem { id title slug content excerpt status publishedAt createdAt updatedAt kind enquiryUrl } } }`;
const DELETE = graphql`mutation AdminPageItemDeleteMutation($input: DeletePageItemInput!) { deletePageItem(input: $input) { deletedId } }`;

export function useAdminPageItemMutation() {
  const [create] = useMutationAction<useContentMutationOperation>(CREATE);
  const [update] = useMutationAction<useContentMutationOperation>(UPDATE);
  const [publish] = useMutationAction<useContentMutationOperation>(PUBLISH);
  const [unpublish] = useMutationAction<useContentMutationOperation>(UNPUBLISH);
  const [remove] = useMutationAction<useContentMutationOperation>(DELETE);
  return useContentMutation({ create, update, publish, unpublish, delete: remove });
}
