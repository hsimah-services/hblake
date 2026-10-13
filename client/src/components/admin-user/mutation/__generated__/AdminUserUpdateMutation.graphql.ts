/**
 * @generated SignedSource<<331322d83a52acfde0ce34b500386e25>>
 * @relayHash f7b858a5a008ff91f186c8aac62c34c9
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID f7b858a5a008ff91f186c8aac62c34c9

import { ConcreteRequest } from 'relay-runtime';
export type UpdateAdminUserInput = {
  clientMutationId?: string | null | undefined;
  displayName?: string | null | undefined;
  id: string;
};
export type AdminUserUpdateMutation$variables = {
  input: UpdateAdminUserInput;
};
export type AdminUserUpdateMutation$data = {
  readonly updateAdminUser: {
    readonly adminUser: {
      readonly displayName: string | null | undefined;
      readonly id: string;
      readonly username: string | null | undefined;
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
            "name": "username",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "displayName",
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
    "cacheID": "f7b858a5a008ff91f186c8aac62c34c9",
    "id": "f7b858a5a008ff91f186c8aac62c34c9",
    "metadata": {},
    "name": "AdminUserUpdateMutation",
    "operationKind": "mutation",
    "text": "mutation AdminUserUpdateMutation(\n  $input: UpdateAdminUserInput!\n) {\n  updateAdminUser(input: $input) {\n    adminUser {\n      id\n      username\n      displayName\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "95c6739b46e8011d333a03d29afccd43";

export default node;
