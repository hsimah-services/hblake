/**
 * @generated SignedSource<<d00f8aa7f64758bf763e2edeff9fdf07>>
 * @relayHash 1292fd48741d633dedf20900890d24b4
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 1292fd48741d633dedf20900890d24b4

import { ConcreteRequest } from 'relay-runtime';
export type PageAccent = "BERRY" | "BLUE" | "GREEN" | "INK" | "ORANGE" | "%future added value";
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
      readonly accent: PageAccent;
      readonly content: string;
      readonly createdAt: string;
      readonly excerpt: string;
      readonly featureOnHome: boolean;
      readonly homeOrder: number;
      readonly id: string;
      readonly navigationOrder: number;
      readonly publishedAt: string | null | undefined;
      readonly showInNavigation: boolean;
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
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "showInNavigation",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "navigationOrder",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "featureOnHome",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "homeOrder",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "accent",
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
    "cacheID": "1292fd48741d633dedf20900890d24b4",
    "id": "1292fd48741d633dedf20900890d24b4",
    "metadata": {},
    "name": "AdminPageUnpublishMutation",
    "operationKind": "mutation",
    "text": "mutation AdminPageUnpublishMutation(\n  $input: UnpublishPageInput!\n) {\n  unpublishPage(input: $input) {\n    page {\n      id\n      title\n      slug\n      content\n      excerpt\n      status\n      publishedAt\n      createdAt\n      updatedAt\n      showInNavigation\n      navigationOrder\n      featureOnHome\n      homeOrder\n      accent\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "a6ca198877b0d17e4b8f032dce1c93f3";

export default node;
