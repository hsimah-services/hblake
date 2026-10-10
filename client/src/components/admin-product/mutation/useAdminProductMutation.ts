import { graphql } from 'react-relay';
import { useContentMutation } from '../../../relay/useContentMutation';

const CREATE = graphql`mutation AdminProductCreateMutation($input: CreateProductInput!) { createProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const UPDATE = graphql`mutation AdminProductUpdateMutation($input: UpdateProductInput!) { updateProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const PUBLISH = graphql`mutation AdminProductPublishMutation($input: PublishProductInput!) { publishProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const UNPUBLISH = graphql`mutation AdminProductUnpublishMutation($input: UnpublishProductInput!) { unpublishProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const DELETE = graphql`mutation AdminProductDeleteMutation($input: DeleteProductInput!) { deleteProduct(input: $input) { deletedId } }`;
const OPERATIONS = { create: CREATE, update: UPDATE, publish: PUBLISH, unpublish: UNPUBLISH, delete: DELETE };

export function useAdminProductMutation() { return useContentMutation(OPERATIONS); }
