/**
 * @generated SignedSource<<092bc52cb20d38fe9fd5d035978c5bae>>
 * @relayHash 9807e453222d7c25398a8cbe3925f9b6
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 9807e453222d7c25398a8cbe3925f9b6

import { ConcreteRequest } from 'relay-runtime';
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type PublishPageItemInput = {
  clientMutationId?: string | null | undefined;
  id: string;
};
export type AdminPageItemPublishMutation$variables = {
  input: PublishPageItemInput;
};
export type AdminPageItemPublishMutation$data = {
  readonly publishPageItem: {
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
export type AdminPageItemPublishMutation = {
  response: AdminPageItemPublishMutation$data;
  variables: AdminPageItemPublishMutation$variables;
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
    "concreteType": "PublishPageItemPayload",
    "kind": "LinkedField",
    "name": "publishPageItem",
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
    "name": "AdminPageItemPublishMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminPageItemPublishMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "9807e453222d7c25398a8cbe3925f9b6",
    "id": "9807e453222d7c25398a8cbe3925f9b6",
    "metadata": {},
    "name": "AdminPageItemPublishMutation",
    "operationKind": "mutation",
    "text": "mutation AdminPageItemPublishMutation(\n  $input: PublishPageItemInput!\n) {\n  publishPageItem(input: $input) {\n    pageItem {\n      id\n      title\n      slug\n      content\n      excerpt\n      status\n      publishedAt\n      createdAt\n      updatedAt\n      kind\n      enquiryUrl\n      imageUrl\n      imageAlt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "2ae97b785981a51e3f522c76624de183";

export default node;
