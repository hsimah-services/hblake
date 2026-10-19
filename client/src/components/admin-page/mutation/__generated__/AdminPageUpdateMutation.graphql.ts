/**
 * @generated SignedSource<<a0d6095e18c805bd3be2881f06480a38>>
 * @relayHash 972f1089f664c07710fdb663c199b59f
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 972f1089f664c07710fdb663c199b59f

import { ConcreteRequest } from 'relay-runtime';
export type PageAccent = "BERRY" | "BLUE" | "GREEN" | "INK" | "ORANGE" | "%future added value";
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type UpdatePageInput = {
  accent?: PageAccent | null | undefined;
  clientMutationId?: string | null | undefined;
  content?: string | null | undefined;
  excerpt?: string | null | undefined;
  featureOnHome?: boolean | null | undefined;
  homeOrder?: number | null | undefined;
  id: string;
  navigationOrder?: number | null | undefined;
  publishedAt?: string | null | undefined;
  showInNavigation?: boolean | null | undefined;
  slug?: string | null | undefined;
  status?: PublicationStatus | null | undefined;
  title?: string | null | undefined;
};
export type AdminPageUpdateMutation$variables = {
  input: UpdatePageInput;
};
export type AdminPageUpdateMutation$data = {
  readonly updatePage: {
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
export type AdminPageUpdateMutation = {
  response: AdminPageUpdateMutation$data;
  variables: AdminPageUpdateMutation$variables;
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
    "name": "AdminPageUpdateMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminPageUpdateMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "972f1089f664c07710fdb663c199b59f",
    "id": "972f1089f664c07710fdb663c199b59f",
    "metadata": {},
    "name": "AdminPageUpdateMutation",
    "operationKind": "mutation",
    "text": "mutation AdminPageUpdateMutation(\n  $input: UpdatePageInput!\n) {\n  updatePage(input: $input) {\n    page {\n      id\n      title\n      slug\n      content\n      excerpt\n      status\n      publishedAt\n      createdAt\n      updatedAt\n      showInNavigation\n      navigationOrder\n      featureOnHome\n      homeOrder\n      accent\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "053192c7b06cd9db8d32cd3fc226d872";

export default node;
