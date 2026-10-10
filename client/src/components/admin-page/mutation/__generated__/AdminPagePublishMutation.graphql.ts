/**
 * @generated SignedSource<<17e7576a99eff3957f63c096734e12f8>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type PublishPageInput = {
  clientMutationId?: string | null | undefined;
  id: string;
};
export type AdminPagePublishMutation$variables = {
  input: PublishPageInput;
};
export type AdminPagePublishMutation$data = {
  readonly publishPage: {
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
export type AdminPagePublishMutation = {
  response: AdminPagePublishMutation$data;
  variables: AdminPagePublishMutation$variables;
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
    "concreteType": "PublishPagePayload",
    "kind": "LinkedField",
    "name": "publishPage",
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
    "name": "AdminPagePublishMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminPagePublishMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "b65d2b8a24e467de34e009f249226b55",
    "id": null,
    "metadata": {},
    "name": "AdminPagePublishMutation",
    "operationKind": "mutation",
    "text": "mutation AdminPagePublishMutation(\n  $input: PublishPageInput!\n) {\n  publishPage(input: $input) {\n    page {\n      id\n      title\n      slug\n      content\n      excerpt\n      status\n      publishedAt\n      createdAt\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "0e7131650079dcdd7f577088020743fb";

export default node;
