/**
 * @generated SignedSource<<d90435317e26070a15f9a529e1d9980d>>
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
export type AdminUserUpdateMutation$variables = {
  input: UpdateAdminUserInput;
};
export type AdminUserUpdateMutation$data = {
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
export type AdminUserUpdateMutation = {
  response: AdminUserUpdateMutation$data;
  variables: AdminUserUpdateMutation$variables;
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
    "name": "AdminUserUpdateMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminUserUpdateMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "2d81f67730f1ac8bd555095359a1baae",
    "id": null,
    "metadata": {},
    "name": "AdminUserUpdateMutation",
    "operationKind": "mutation",
    "text": "mutation AdminUserUpdateMutation(\n  $input: UpdateAdminUserInput!\n) {\n  updateAdminUser(input: $input) {\n    adminUser {\n      id\n      email\n      displayName\n      role\n      active\n      createdAt\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "d86bee5a9bf51882711b965213e2e1ed";

export default node;
