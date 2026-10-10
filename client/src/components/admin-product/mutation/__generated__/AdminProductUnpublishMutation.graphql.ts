/**
 * @generated SignedSource<<6e3bfdf2056dac4e7396c693146f0fe0>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type UnpublishProductInput = {
  clientMutationId?: string | null | undefined;
  id: string;
};
export type AdminProductUnpublishMutation$variables = {
  input: UnpublishProductInput;
};
export type AdminProductUnpublishMutation$data = {
  readonly unpublishProduct: {
    readonly product: {
      readonly content: string;
      readonly createdAt: string;
      readonly enquiryUrl: string | null | undefined;
      readonly excerpt: string;
      readonly id: string;
      readonly publishedAt: string | null | undefined;
      readonly slug: string;
      readonly status: PublicationStatus;
      readonly title: string;
      readonly updatedAt: string;
    } | null | undefined;
  } | null | undefined;
};
export type AdminProductUnpublishMutation = {
  response: AdminProductUnpublishMutation$data;
  variables: AdminProductUnpublishMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "UnpublishProductPayload",
    "kind": "LinkedField",
    "name": "unpublishProduct",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "product",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "title",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "slug",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "content",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "excerpt",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "status",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "publishedAt",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "createdAt",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "updatedAt",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "enquiryUrl",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "AdminProductUnpublishMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminProductUnpublishMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "43db37ab0ce359ef573e08a0b6089030",
    "id": null,
    "metadata": {},
    "name": "AdminProductUnpublishMutation",
    "operationKind": "mutation",
    "text": "mutation AdminProductUnpublishMutation(\n  $input: UnpublishProductInput!\n) {\n  unpublishProduct(input: $input) {\n    product {\n      id\n      title\n      slug\n      content\n      excerpt\n      status\n      publishedAt\n      createdAt\n      updatedAt\n      enquiryUrl\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "07cf506445ce4b2818a460906d234652";

export default node;
