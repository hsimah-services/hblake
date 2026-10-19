/**
 * @generated SignedSource<<da22b79ca3217d58cffc41f16afcfbf2>>
 * @relayHash db3f24b6bdf74849761746ff4e4e28af
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID db3f24b6bdf74849761746ff4e4e28af

import { ConcreteRequest } from 'relay-runtime';
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type UnpublishPageItemInput = {
  clientMutationId?: string | null | undefined;
  id: string;
};
export type AdminPageItemUnpublishMutation$variables = {
  input: UnpublishPageItemInput;
};
export type AdminPageItemUnpublishMutation$data = {
  readonly unpublishPageItem: {
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
export type AdminPageItemUnpublishMutation = {
  response: AdminPageItemUnpublishMutation$data;
  variables: AdminPageItemUnpublishMutation$variables;
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
    "concreteType": "UnpublishPageItemPayload",
    "kind": "LinkedField",
    "name": "unpublishPageItem",
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
    "name": "AdminPageItemUnpublishMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminPageItemUnpublishMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "db3f24b6bdf74849761746ff4e4e28af",
    "id": "db3f24b6bdf74849761746ff4e4e28af",
    "metadata": {},
    "name": "AdminPageItemUnpublishMutation",
    "operationKind": "mutation",
    "text": "mutation AdminPageItemUnpublishMutation(\n  $input: UnpublishPageItemInput!\n) {\n  unpublishPageItem(input: $input) {\n    pageItem {\n      id\n      title\n      slug\n      content\n      excerpt\n      status\n      publishedAt\n      createdAt\n      updatedAt\n      kind\n      enquiryUrl\n      imageUrl\n      imageAlt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1cc54db6ac6ff0d8f3411f02f458319c";

export default node;
