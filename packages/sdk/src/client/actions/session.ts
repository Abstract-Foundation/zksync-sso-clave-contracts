import { type Account, type Address, type Chain, type Client, encodeFunctionData, type Hash, type Prettify, type TransactionReceipt, type Transport } from "viem";
import { publicKeyToAddress } from "viem/accounts";
import { readContract, waitForTransactionReceipt } from "viem/actions";
import { sendTransaction } from "viem/zksync";

import { SessionKeyModuleAbi } from "../../abi/SessionKeyModule.js";
import type { SessionData } from "../../client-gateway/interface.js";
import { getSession } from "../../utils/session.js";
import { noThrow } from "../../utils/helpers.js";

/* DO NOT USE THIS. USE FUNCTION FROM PASSKEY ACTIONS INSTEAD */
/* TODO: Remove */
/* export type RequestSessionArgs = Prettify<SessionPreferences & {
  sessionKey?: Hash;
  contracts: {
    session: Address
  }
}> & ({ passkeyRegistrationResponse: RegistrationResponseJSON } | { passkeyRegistrationOptions: GeneratePasskeyRegistrationOptionsArgs });
export type RequestSessionReturnType<chain extends Chain> = {
  transactionReceipt: ExtractChainFormatterReturnType<chain, "transactionReceipt", TransactionReceipt>;
  sessionKey: Hash;
}
export const requestSession = async <
  transport extends Transport,
  chain extends Chain,
  account extends Account
>(client: Client<transport, chain, account>, args: RequestSessionArgs): Promise<RequestSessionReturnType<chain>> => {
  const passkeyRegistrationResponse: RegistrationResponseJSON =
    'passkeyRegistrationResponse' in args
      ? args.passkeyRegistrationResponse
      : (await requestPasskeySignature(args.passkeyRegistrationOptions)).passkeyRegistrationResponse;

  const sessionKey = args.sessionKey || generatePrivateKey();
  const sessionKeyPublicAddress = publicKeyToAddress(sessionKey);
  const transactionHash = await createSessionWithPasskey(client, {
    sessionKeyPublicAddress,
    passkeyRegistrationResponse,
    contracts: args.contracts,
    spendLimit: args.spendLimit,
    validUntil: args.validUntil,
  });
  const receipt = await waitForTransactionReceipt(client, { hash: transactionHash });
  if (receipt.status === "reverted") throw new Error("Transaction reverted");
  return {
    transactionReceipt: receipt,
    sessionKey,
  };
} */

/* DO NOT USE THIS. USE FUNCTION FROM PASSKEY ACTIONS INSTEAD */
/* TODO: Remove */
/* export type CreateSessionWithPasskeyArgs = Prettify<SessionPreferences & {
  sessionKeyPublicAddress: Address;
  passkeyRegistrationResponse: RegistrationResponseJSON;
  contracts: { session: Address };
}>
export type CreateSessionWithPasskeyReturnType = Hash;
export const createSessionWithPasskey = async <
  transport extends Transport,
  chain extends Chain,
  account extends Account,
>(client: Client<transport, chain, account>, args: CreateSessionWithPasskeyArgs): Promise<CreateSessionWithPasskeyReturnType> => {
  // TODO: Implement set session
  const transactionHash = await writeContract(client, {
    address: args.contracts.session,
    args: [args.sessionKeyPublicAddress, args.passkeyRegistrationResponse, args.spendLimit, args.validUntil],
    abi: [] as const,
    functionName: "USE_ACTUAL_METHOD_HERE2222",
  } as any);
  return transactionHash;
} */

// export type GetRemainingTokenSpendLimitArgs =
//  ({ sessionKey: Hash } | { sessionKeyPublicAddress: Address })
//  & {
//    tokenAddress: Address;
//    contracts: { session: Address };
//  };
// export type GetRemainingTokenSpendLimitReturnType = bigint;
// export const getRemainingTokenSpendLimit = async <
//   transport extends Transport,
//   chain extends Chain,
//   account extends Account,
// >(client: Client<transport, chain, account>, args: GetRemainingTokenSpendLimitArgs): Promise<Prettify<GetRemainingTokenSpendLimitReturnType>> => {
//   const sessionKeyPublicAddress = "sessionKey" in args ? publicKeyToAddress(args.sessionKey) : args.sessionKeyPublicAddress;
//   const remainingTokenSpendLimit = await readContract(client, {
//     address: args.contracts.session,
//     abi: SessionKeyModuleAbi,
//     functionName: "getRemainingSpendLimit",
//     args: [sessionKeyPublicAddress, args.tokenAddress],
//   });
//
//   return remainingTokenSpendLimit;
// };


export type CreateSessionArgs = {
  session: SessionData;
  contracts: {
    session: Address; // session module
  };
  onTransactionSent?: (hash: Hash) => void;
};
export type CreateSessionReturnType = {
  transactionReceipt: TransactionReceipt;
};
export const createSession = async <
  transport extends Transport,
  chain extends Chain,
  account extends Account,
>(client: Client<transport, chain, account>, args: Prettify<CreateSessionArgs>): Promise<Prettify<CreateSessionReturnType>> => {
  const callData = encodeFunctionData({
    abi: SessionKeyModuleAbi,
    functionName: "createSession",
    args: [{
      ...getSession(args.session),
      signer: args.session.sessionKey,
    }],
  });

  const transactionHash = await sendTransaction(client, {
    to: args.contracts.session,
    data: callData,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  if (args.onTransactionSent) {
    noThrow(() => args.onTransactionSent?.(transactionHash));
  }

  const transactionReceipt = await waitForTransactionReceipt(client, { hash: transactionHash });
  if (transactionReceipt.status !== "success") throw new Error("addSessionKey transaction reverted");

  return {
    transactionReceipt,
  };
};
