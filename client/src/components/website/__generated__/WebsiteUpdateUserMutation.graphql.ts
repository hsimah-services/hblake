/**
 * @generated SignedSource<<95ade6f7b0a320b8c17784e333691869>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UserRole = "ADMIN" | "EDITOR" | "%future added value";
export type UpdateAdminUserInput = {
  clientMutationId?: string | null | undefined;
  displayName?: string | null | undefined;
  email?: string | null | undefined;
  id: string;
};
export type WebsiteUpdateUserMutation$variables = {
  input: UpdateAdminUserInput;
};
export type WebsiteUpdateUserMutation$data = {
  readonly updateAdminUser: {
    readonly adminUser: {
      readonly active: boolean | null | undefined;
      readonly createdAt: string | null | undefined;
      readonly displayName: string | null | undefined;
      readonly email: string | null | undefined;
      readonly id: string;
      readonly role: UserRole | null | undefined;
      readonly updatedAt: string | null | undefined;
    } | null | undefined;
  } | null | undefined;
};
export type WebsiteUpdateUserMutation = {
  response: WebsiteUpdateUserMutation$data;
  variables: WebsiteUpdateUserMutation$variables;
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
    "concreteType": "UpdateAdminUserPayload",
    "kind": "LinkedField",
    "name": "updateAdminUser",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "AdminUser",
        "kind": "LinkedField",
        "name": "adminUser",
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
            "name": "email",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "displayName",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "role",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "active",
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
    "name": "WebsiteUpdateUserMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "WebsiteUpdateUserMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "4278b976a807eefea5b3b8c4871c8ab1",
    "id": null,
    "metadata": {},
    "name": "WebsiteUpdateUserMutation",
    "operationKind": "mutation",
    "text": "mutation WebsiteUpdateUserMutation(\n  $input: UpdateAdminUserInput!\n) {\n  updateAdminUser(input: $input) {\n    adminUser {\n      id\n      email\n      displayName\n      role\n      active\n      createdAt\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "65ea38f853429dff5e3bd4c7f93cc616";

export default node;
