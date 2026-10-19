/**
 * @generated SignedSource<<3a8a0885f7a87dc96e7d96d6c863c7ac>>
 * @relayHash 1a5ba0a57bc331f77f82c253535ade25
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 1a5ba0a57bc331f77f82c253535ade25

import { ConcreteRequest } from 'relay-runtime';
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type UpdatePageItemInput = {
  clientMutationId?: string | null | undefined;
  content?: string | null | undefined;
  enquiryUrl?: string | null | undefined;
  excerpt?: string | null | undefined;
  id: string;
  imageAlt?: string | null | undefined;
  imageUrl?: string | null | undefined;
  kind?: string | null | undefined;
  page?: string | null | undefined;
  publishedAt?: string | null | undefined;
  slug?: string | null | undefined;
  status?: PublicationStatus | null | undefined;
  title?: string | null | undefined;
};
export type AdminPageItemUpdateMutation$variables = {
  input: UpdatePageItemInput;
};
export type AdminPageItemUpdateMutation$data = {
  readonly updatePageItem: {
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
export type AdminPageItemUpdateMutation = {
  response: AdminPageItemUpdateMutation$data;
  variables: AdminPageItemUpdateMutation$variables;
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
    "concreteType": "UpdatePageItemPayload",
    "kind": "LinkedField",
    "name": "updatePageItem",
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
    "name": "AdminPageItemUpdateMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminPageItemUpdateMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "1a5ba0a57bc331f77f82c253535ade25",
    "id": "1a5ba0a57bc331f77f82c253535ade25",
    "metadata": {},
    "name": "AdminPageItemUpdateMutation",
    "operationKind": "mutation",
    "text": "mutation AdminPageItemUpdateMutation(\n  $input: UpdatePageItemInput!\n) {\n  updatePageItem(input: $input) {\n    pageItem {\n      id\n      title\n      slug\n      content\n      excerpt\n      status\n      publishedAt\n      createdAt\n      updatedAt\n      kind\n      enquiryUrl\n      imageUrl\n      imageAlt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "02d302e69521b26d94ee3f16499efc82";

export default node;
