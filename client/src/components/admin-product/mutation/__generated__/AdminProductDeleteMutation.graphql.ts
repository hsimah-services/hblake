/**
 * @generated SignedSource<<f678806b9eaa776ac1b703202810f38d>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DeleteProductInput = {
  clientMutationId?: string | null | undefined;
  id: string;
};
export type AdminProductDeleteMutation$variables = {
  input: DeleteProductInput;
};
export type AdminProductDeleteMutation$data = {
  readonly deleteProduct: {
    readonly deletedId: string | null | undefined;
  } | null | undefined;
};
export type AdminProductDeleteMutation = {
  response: AdminProductDeleteMutation$data;
  variables: AdminProductDeleteMutation$variables;
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
    "concreteType": "DeleteProductPayload",
    "kind": "LinkedField",
    "name": "deleteProduct",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "deletedId",
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
    "name": "AdminProductDeleteMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminProductDeleteMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "51fe0f05a167f4580285d040902256b0",
    "id": null,
    "metadata": {},
    "name": "AdminProductDeleteMutation",
    "operationKind": "mutation",
    "text": "mutation AdminProductDeleteMutation(\n  $input: DeleteProductInput!\n) {\n  deleteProduct(input: $input) {\n    deletedId\n  }\n}\n"
  }
};
})();

(node as any).hash = "5ee3b562286c84f289bf4739f7bde617";

export default node;
