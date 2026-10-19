/**
 * @generated SignedSource<<744ab14dad9d888f653d0a40ab72a13c>>
 * @relayHash 5cc9f1b56e4137be4565154279a91d6b
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 5cc9f1b56e4137be4565154279a91d6b

import { ConcreteRequest } from 'relay-runtime';
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type CreatePageItemInput = {
  clientMutationId?: string | null | undefined;
  content?: string | null | undefined;
  enquiryUrl?: string | null | undefined;
  excerpt?: string | null | undefined;
  imageAlt?: string | null | undefined;
  imageUrl?: string | null | undefined;
  kind?: string | null | undefined;
  page?: string | null | undefined;
  publishedAt?: string | null | undefined;
  slug: string;
  status?: PublicationStatus | null | undefined;
  title: string;
};
export type AdminPageItemCreateMutation$variables = {
  input: CreatePageItemInput;
};
export type AdminPageItemCreateMutation$data = {
  readonly createPageItem: {
    readonly pageItem: {
      readonly content: string;
      readonly createdAt: string;
      readonly enquiryUrl: string | null | undefined;
      readonly excerpt: string;
      readonly id: string;
      readonly imageAlt: string | null | undefined;
      readonly imageUrl: string | null | undefined;
      readonly kind: string;
      readonly publishedAt: string | null | undefined;
      readonly slug: string;
      readonly status: PublicationStatus;
      readonly title: string;
      readonly updatedAt: string;
    } | null | undefined;
  } | null | undefined;
};
export type AdminPageItemCreateMutation = {
  response: AdminPageItemCreateMutation$data;
  variables: AdminPageItemCreateMutation$variables;
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
    "concreteType": "CreatePageItemPayload",
    "kind": "LinkedField",
    "name": "createPageItem",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "PageItem",
        "kind": "LinkedField",
        "name": "pageItem",
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
            "name": "kind",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "enquiryUrl",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "imageUrl",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "imageAlt",
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
    "name": "AdminPageItemCreateMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminPageItemCreateMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "5cc9f1b56e4137be4565154279a91d6b",
    "id": "5cc9f1b56e4137be4565154279a91d6b",
    "metadata": {},
    "name": "AdminPageItemCreateMutation",
    "operationKind": "mutation",
    "text": "mutation AdminPageItemCreateMutation(\n  $input: CreatePageItemInput!\n) {\n  createPageItem(input: $input) {\n    pageItem {\n      id\n      title\n      slug\n      content\n      excerpt\n      status\n      publishedAt\n      createdAt\n      updatedAt\n      kind\n      enquiryUrl\n      imageUrl\n      imageAlt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "5a64fda8a52e7c580ea8a00e9511f2a4";

export default node;
