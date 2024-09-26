import "@matterlabs/hardhat-zksync-node/dist/type-extensions";
import "@matterlabs/hardhat-zksync-verify/dist/src/type-extensions";

import dotenv from "dotenv";
import { ethers } from "ethers";
import { readFileSync } from "fs";
import { promises } from "fs";
import * as hre from "hardhat";
import { ContractFactory, Provider, utils, Wallet } from "zksync-ethers";

import { getPublicKeyBytesFromPasskeySignature } from "./sdk/utils/passkey";

// Load env file
dotenv.config();

export const getProvider = () => {
  const rpcUrl = hre.network.config["url"];
  if (!rpcUrl) throw `⛔️ RPC URL wasn't found in "${hre.network.name}"! Please add a "url" field to the network config in hardhat.config.ts`;

  // Initialize zkSync Provider
  const provider = new Provider(rpcUrl);

  return provider;
};

export async function deployFactory(factoryName: string, wallet: Wallet, expectedAddress?: string): Promise<ethers.Contract> {
  const factoryArtifact = JSON.parse(await promises.readFile(`artifacts-zk/src/${factoryName}.sol/${factoryName}.json`, "utf8"));
  const proxyAaArtifact = JSON.parse(await promises.readFile("artifacts-zk/src/AccountProxy.sol/AccountProxy.json", "utf8"));

  const deployer = new ContractFactory(factoryArtifact.abi, factoryArtifact.bytecode, wallet);
  const factory = await deployer.deploy(utils.hashBytecode(proxyAaArtifact.bytecode));
  const factoryAddress = await factory.getAddress();

  if (expectedAddress && factoryAddress != expectedAddress) {
    console.warn(`${factoryName}.sol address is not the expected default address (${expectedAddress}).`);
    console.warn(`Please update the default value in your tests or restart Era Test Node. Proceeding with expected default address...`);
    return new ethers.Contract(expectedAddress, factoryArtifact.abi, wallet);
  }

  return new ethers.Contract(factoryAddress, factoryArtifact.abi, wallet);
}

export const getWallet = (privateKey?: string) => {
  if (!privateKey) {
    // Get wallet private key from .env file
    if (!process.env.WALLET_PRIVATE_KEY) throw "⛔️ Wallet private key wasn't found in .env file!";
  }

  const provider = getProvider();

  // Initialize zkSync Wallet
  const wallet = new Wallet(privateKey ?? process.env.WALLET_PRIVATE_KEY!, provider);

  return wallet;
};

export const verifyEnoughBalance = async (wallet: Wallet, amount: bigint) => {
  // Check if the wallet has enough balance
  const balance = await wallet.getBalance();
  if (balance < amount) throw `⛔️ Wallet balance is too low! Required ${ethers.formatEther(amount)} ETH, but current ${wallet.address} balance is ${ethers.formatEther(balance)} ETH`;
};

/**
 * @param {string} data.contract The contract's path and name. E.g., "contracts/Greeter.sol:Greeter"
 */
export const verifyContract = async (data: {
  address: string;
  contract: string;
  constructorArguments: string;
  bytecode: string;
}) => {
  const verificationRequestId: number = await hre.run("verify:verify", {
    ...data,
    noCompile: true,
  });
  return verificationRequestId;
};

export const create2 = async (contractName: string, wallet: Wallet, salt: ethers.BytesLike, args?: ReadonlyArray<string>) => {
  if (!salt["startsWith"]) {
    salt = ethers.hexlify(salt);
  }
  const contractArtifact = await hre.artifacts.readArtifact(contractName);
  const deployer = new ContractFactory(contractArtifact.abi, contractArtifact.bytecode, wallet, "create2");
  const bytecodeHash = utils.hashBytecode(contractArtifact.bytecode);
  const constructorArgs = deployer.interface.encodeDeploy(args);
  const standardCreate2Address = utils.create2Address(wallet.address, bytecodeHash, salt, args ? constructorArgs : "0x");
  const accountCode = await wallet.provider.getCode(standardCreate2Address);
  if (accountCode != "0x") {
    return new ethers.Contract(standardCreate2Address, contractArtifact.abi, wallet);
  }

  const deployingContract = await (args ? deployer.deploy(...args, { customData: { salt } }) : deployer.deploy({ customData: { salt } }));
  const deployedContract = await deployingContract.waitForDeployment();
  const deployedContractAddress = await deployedContract.getAddress();
  logInfo(`"${contractName}" was successfully deployed to ${deployedContractAddress}`);

  if (standardCreate2Address != deployedContractAddress) {
    logWarning("Unexpected Create2 address, perhaps salt is misconfigured?");
    logWarning(`addressFromCreate2: ${standardCreate2Address}`);
    logWarning(`deployedContractAddress: ${deployedContractAddress}`);
  }

  return new ethers.Contract(deployedContractAddress, contractArtifact.abi, wallet);
};

export function logInfo(message: string) {
  console.log("\x1b[36m%s\x1b[0m", message);
}

export function logWarning(message: string) {
  console.log("\x1b[33m%s\x1b[0m", message);
}

/**
 * Rich wallets can be used for testing purposes.
 * Available on ZKsync In-memory node and docker node.
 */
export const LOCAL_RICH_WALLETS = [
  {
    address: "0xBC989fDe9e54cAd2aB4392Af6dF60f04873A033A",
    privateKey: "0x3d3cbc973389cb26f657686445bcc75662b415b656078503592ac8c1abb8810e",
  },
  {
    address: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
    privateKey: "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110",
  },
  {
    address: "0xa61464658AfeAf65CccaaFD3a512b69A83B77618",
    privateKey: "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3",
  },
  {
    address: "0x0D43eB5B8a47bA8900d84AA36656c92024e9772e",
    privateKey: "0xd293c684d884d56f8d6abd64fc76757d3664904e309a0645baf8522ab6366d9e",
  },
  {
    address: "0xA13c10C0D5bd6f79041B9835c63f91de35A15883",
    privateKey: "0x850683b40d4a740aa6e745f889a6fdc8327be76e122f5aba645a5b02d0248db8",
  },
  {
    address: "0x8002cD98Cfb563492A6fB3E7C8243b7B9Ad4cc92",
    privateKey: "0xf12e28c0eb1ef4ff90478f6805b68d63737b7f33abfa091601140805da450d93",
  },
  {
    address: "0x4F9133D1d3F50011A6859807C837bdCB31Aaab13",
    privateKey: "0xe667e57a9b8aaa6709e51ff7d093f1c5b73b63f9987e4ab4aa9a5c699e024ee8",
  },
  {
    address: "0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA",
    privateKey: "0x28a574ab2de8a00364d5dd4b07c4f2f574ef7fcc2a86a197f65abaec836d1959",
  },
  {
    address: "0xedB6F5B4aab3dD95C7806Af42881FF12BE7e9daa",
    privateKey: "0x74d8b3a188f7260f67698eb44da07397a298df5427df681ef68c45b34b61f998",
  },
  {
    address: "0xe706e60ab5Dc512C36A4646D719b889F398cbBcB",
    privateKey: "0xbe79721778b48bcc679b78edac0ce48306a8578186ffcb9f2ee455ae6efeace1",
  },
  {
    address: "0xE90E12261CCb0F3F7976Ae611A29e84a6A85f424",
    privateKey: "0x3eb15da85647edd9a1159a4a13b9e7c56877c4eb33f614546d4db06a51868b1c",
  },
];

const convertObjArrayToUint8Array = (objArray: {
  [key: string]: number;
}): Uint8Array => {
  const objEntries = Object.entries(objArray);
  return objEntries.reduce((existingArray, nextKv) => {
    const index = parseInt(nextKv[0]);
    existingArray[index] = nextKv[1];
    return existingArray;
  }, new Uint8Array(objEntries.length));
};

export class RecordedResponse {
  constructor(filename: string) {
    // loading directly from the response that was written (verifyAuthenticationResponse)
    const jsonFile = readFileSync(filename, "utf-8");
    const responseData = JSON.parse(jsonFile);
    this.authenticatorData = responseData.response.response.authenticatorData;
    this.clientData = responseData.response.response.clientDataJSON;
    this.b64SignedChallenge = responseData.response.response.signature;
    this.passkeyBytes = convertObjArrayToUint8Array(responseData.authenticator.credentialPublicKey);
  }

  // this is just the public key in xy format without the alg type
  async getXyPublicKey() {
    return await getPublicKeyBytesFromPasskeySignature(this.passkeyBytes);
  }

  // this is the encoded data explaining what authenticator was used (fido, web, etc)
  readonly authenticatorData: string;
  // this is a b64 encoded json object
  readonly clientData: string;
  // signed challange should come from signed transaction hash (challange is the transaction hash)
  readonly b64SignedChallenge: string;
  // This is a binary object formatted by @simplewebauthn that contains the alg type and public key
  readonly passkeyBytes: Uint8Array;
}
