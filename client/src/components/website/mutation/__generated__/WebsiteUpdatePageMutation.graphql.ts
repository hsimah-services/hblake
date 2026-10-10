/**
 * @generated SignedSource<<231ee970d60a52f2ba80ff39ce87906f>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type UpdatePageInput = {
  clientMutationId?: string | null | undefined;
  content?: string | null | undefined;
  excerpt?: string | null | undefined;
  id: string;
  publishedAt?: string | null | undefined;
  slug?: string | null | undefined;
  status?: PublicationStatus | null | undefined;
  title?: string | null | undefined;
};
export type WebsiteUpdatePageMutation$variables = {
  input: UpdatePageInput;
};
export type WebsiteUpdatePageMutation$data = {
  readonly updatePage: {
    readonly page: {
      readonly content: string;
      readonly createdAt: string;
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
export type WebsiteUpdatePageMutation = {
  response: WebsiteUpdatePageMutation$data;
  variables: WebsiteUpdatePageMutation$variables;
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
    "concreteType": "UpdatePagePayload",
    "kind": "LinkedField",
    "name": "updatePage",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Page",
        "kind": "LinkedField",
        "name": "page",
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
    "name": "WebsiteUpdatePageMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "WebsiteUpdatePageMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "682549ed421147f2e7b0eb25cd1d8fac",
    "id": null,
    "metadata": {},
    "name": "WebsiteUpdatePageMutation",
    "operationKind": "mutation",
    "text": "mutation WebsiteUpdatePageMutation(\n  $input: UpdatePageInput!\n) {\n  updatePage(input: $input) {\n    page {\n      id\n      title\n      slug\n      content\n      excerpt\n      status\n      publishedAt\n      createdAt\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "51e21727d1af04a6cb69d4ae2f8198b2";

export default node;
