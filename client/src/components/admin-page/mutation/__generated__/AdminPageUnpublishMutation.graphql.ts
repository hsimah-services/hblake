/**
 * @generated SignedSource<<c0c841e7f2f4341204a94d5fabc34961>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type UnpublishPageInput = {
  clientMutationId?: string | null | undefined;
  id: string;
};
export type AdminPageUnpublishMutation$variables = {
  input: UnpublishPageInput;
};
export type AdminPageUnpublishMutation$data = {
  readonly unpublishPage: {
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
export type AdminPageUnpublishMutation = {
  response: AdminPageUnpublishMutation$data;
  variables: AdminPageUnpublishMutation$variables;
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
    "concreteType": "UnpublishPagePayload",
    "kind": "LinkedField",
    "name": "unpublishPage",
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
    "name": "AdminPageUnpublishMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminPageUnpublishMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "07ecbf098d61233344d81d31b99b5287",
    "id": null,
    "metadata": {},
    "name": "AdminPageUnpublishMutation",
    "operationKind": "mutation",
    "text": "mutation AdminPageUnpublishMutation(\n  $input: UnpublishPageInput!\n) {\n  unpublishPage(input: $input) {\n    page {\n      id\n      title\n      slug\n      content\n      excerpt\n      status\n      publishedAt\n      createdAt\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "fde5e40b7f7846860e48108539693028";

export default node;
