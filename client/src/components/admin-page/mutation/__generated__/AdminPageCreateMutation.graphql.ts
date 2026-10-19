/**
 * @generated SignedSource<<fceed807354808d6814003b297eb49b4>>
 * @relayHash 8497761f27c0e3a4ed9ca0a52d09ce69
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 8497761f27c0e3a4ed9ca0a52d09ce69

import { ConcreteRequest } from 'relay-runtime';
export type PageAccent = "BERRY" | "BLUE" | "GREEN" | "INK" | "ORANGE" | "%future added value";
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type CreatePageInput = {
  accent?: PageAccent | null | undefined;
  clientMutationId?: string | null | undefined;
  content?: string | null | undefined;
  excerpt?: string | null | undefined;
  featureOnHome?: boolean | null | undefined;
  homeOrder?: number | null | undefined;
  navigationOrder?: number | null | undefined;
  publishedAt?: string | null | undefined;
  showInNavigation?: boolean | null | undefined;
  slug: string;
  status?: PublicationStatus | null | undefined;
  title: string;
};
export type AdminPageCreateMutation$variables = {
  input: CreatePageInput;
};
export type AdminPageCreateMutation$data = {
  readonly createPage: {
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
export type AdminPageCreateMutation = {
  response: AdminPageCreateMutation$data;
  variables: AdminPageCreateMutation$variables;
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
    "concreteType": "CreatePagePayload",
    "kind": "LinkedField",
    "name": "createPage",
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
    "name": "AdminPageCreateMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminPageCreateMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "8497761f27c0e3a4ed9ca0a52d09ce69",
    "id": "8497761f27c0e3a4ed9ca0a52d09ce69",
    "metadata": {},
    "name": "AdminPageCreateMutation",
    "operationKind": "mutation",
    "text": "mutation AdminPageCreateMutation(\n  $input: CreatePageInput!\n) {\n  createPage(input: $input) {\n    page {\n      id\n      title\n      slug\n      content\n      excerpt\n      status\n      publishedAt\n      createdAt\n      updatedAt\n      showInNavigation\n      navigationOrder\n      featureOnHome\n      homeOrder\n      accent\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "7344721e263b1a786a63f5afd7f74f1f";

export default node;
