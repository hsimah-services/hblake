/**
 * @generated SignedSource<<f7a440e3a6a5ea6698293065bda94cd1>>
 * @relayHash 3e59766eb791a0e7eb6702a162182e08
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 3e59766eb791a0e7eb6702a162182e08

import { ConcreteRequest } from 'relay-runtime';
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type UpdatePostInput = {
  clientMutationId?: string | null | undefined;
  content?: string | null | undefined;
  excerpt?: string | null | undefined;
  id: string;
  publishedAt?: string | null | undefined;
  slug?: string | null | undefined;
  status?: PublicationStatus | null | undefined;
  title?: string | null | undefined;
};
export type AdminPostUpdateMutation$variables = {
  input: UpdatePostInput;
};
export type AdminPostUpdateMutation$data = {
  readonly updatePost: {
    readonly post: {
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
export type AdminPostUpdateMutation = {
  response: AdminPostUpdateMutation$data;
  variables: AdminPostUpdateMutation$variables;
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
    "concreteType": "UpdatePostPayload",
    "kind": "LinkedField",
    "name": "updatePost",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Post",
        "kind": "LinkedField",
        "name": "post",
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
    "name": "AdminPostUpdateMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminPostUpdateMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "3e59766eb791a0e7eb6702a162182e08",
    "id": "3e59766eb791a0e7eb6702a162182e08",
    "metadata": {},
    "name": "AdminPostUpdateMutation",
    "operationKind": "mutation",
    "text": "mutation AdminPostUpdateMutation(\n  $input: UpdatePostInput!\n) {\n  updatePost(input: $input) {\n    post {\n      id\n      title\n      slug\n      content\n      excerpt\n      status\n      publishedAt\n      createdAt\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "bb55d645a785b3d9351d25a49d40017e";

export default node;
