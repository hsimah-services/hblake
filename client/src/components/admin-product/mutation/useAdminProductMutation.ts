import { graphql } from 'react-relay';
import { useMutationAction } from '@tsquid/routes/mutation';
import { useContentMutation, type useContentMutationOperation } from '../../../relay/useContentMutation';

const CREATE = graphql`mutation AdminProductCreateMutation($input: CreateProductInput!) { createProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const UPDATE = graphql`mutation AdminProductUpdateMutation($input: UpdateProductInput!) { updateProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const PUBLISH = graphql`mutation AdminProductPublishMutation($input: PublishProductInput!) { publishProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const UNPUBLISH = graphql`mutation AdminProductUnpublishMutation($input: UnpublishProductInput!) { unpublishProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const DELETE = graphql`mutation AdminProductDeleteMutation($input: DeleteProductInput!) { deleteProduct(input: $input) { deletedId } }`;

export function useAdminProductMutation() {
  const [create] = useMutationAction<useContentMutationOperation>(CREATE);
  const [update] = useMutationAction<useContentMutationOperation>(UPDATE);
  const [publish] = useMutationAction<useContentMutationOperation>(PUBLISH);
  const [unpublish] = useMutationAction<useContentMutationOperation>(UNPUBLISH);
  const [remove] = useMutationAction<useContentMutationOperation>(DELETE);
  return useContentMutation({ create, update, publish, unpublish, delete: remove });
}
