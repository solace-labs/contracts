export * from "../stackup/account-abstraction/test/UserOp";
export * from "../stackup/account-abstraction/test/UserOperation";
export * from "../stackup/account-abstraction/test/testutils";
export * from "../stackup/account-abstraction/typechain";
import { Create2Factory } from "../stackup/account-abstraction/src/Create2Factory";
import { ethers } from "hardhat";
import { Wallet, Signer } from "ethers";
import {
  EntryPoint,
  TestCounter,
  TestCounter__factory,
} from "../stackup/account-abstraction/typechain";
import { fillAndSign } from "../stackup/account-abstraction/test/UserOp";
import {
  Boundary,
  Boundary__factory,
  Game,
  Game__factory,
  SessionBase,
  SolaceAccount,
  SolaceAccountFactory__factory,
  VerifyingPaymaster,
  VerifyingPaymaster__factory,
} from "../typechain-types";
import { deployEntryPoint } from "../stackup/account-abstraction/test/testutils";
import { SolaceAccountFactory } from "../typechain-types/contracts/SolaceAccountFactory.sol";

export const MOCK_VALID_UNTIL = "0x00000000deadbeef";
export const MOCK_VALID_AFTER = "0x0000000000001234";
const MOCK_SIG = "0x1234";
const MOCK_ERC20_ADDR = "0x" + "01".repeat(20);

export const encodePaymasterData = (
  token = ethers.constants.AddressZero,
  fx = ethers.constants.Zero
) => {
  return ethers.utils.defaultAbiCoder.encode(
    ["uint48", "uint48", "address", "uint256"],
    [MOCK_VALID_UNTIL, MOCK_VALID_AFTER, token, fx]
  );
};

export const ArgumentType = {
  UINT: 0,
  STRING: 1,
  ADDRESS: 2,
  BYTES: 3,
};

export async function encodeFunctionCall(
  call: any,
  solaceAccount?: SolaceAccount
) {
  if (solaceAccount) return await solaceAccount.encodeSessionData(call);
  let encodedArguments: any = [];
  call.arguments.forEach((arg: any) => {
    encodedArguments.push(
      ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes", "bytes"],
        [
          arg.argType,
          ethers.utils.toUtf8Bytes(arg.paramLowerBound),
          ethers.utils.toUtf8Bytes(arg.paramUpperBound),
        ]
      )
    );
  });

  return ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "bytes4", "uint48", "uint48", "bytes[]"],
    [
      call.targetContract,
      call.sessionKey,
      call.functionSelector,
      call.validUntil,
      call.validFrom,
      encodedArguments,
    ]
  );
}

export const getPaymasterData = async (
  senderAddress: string,
  callData: any,
  paymaster: VerifyingPaymaster,
  entryPoint: EntryPoint,
  signer: Wallet,
  admin: Signer,
  customSig?: string
) => {
  const partialUserOp = await fillAndSign(
    {
      sender: senderAddress,
      callData,
      paymasterAndData: ethers.utils.hexConcat([
        paymaster.address,
        encodePaymasterData(),
        "0x" + "00".repeat(65),
      ]),
    },
    signer,
    entryPoint
  );

  const hash = await paymaster.getHash(
    partialUserOp,
    MOCK_VALID_UNTIL,
    MOCK_VALID_AFTER,
    ethers.constants.AddressZero,
    ethers.constants.Zero
  );
  if (customSig) partialUserOp.signature = customSig;

  const sig = await admin.signMessage(ethers.utils.arrayify(hash));
  const userOp = await fillAndSign(
    {
      ...partialUserOp,
      paymasterAndData: ethers.utils.hexConcat([
        paymaster.address,
        encodePaymasterData(),
        sig,
      ]),
    },
    signer,
    entryPoint
  );
  return userOp;
};

// export type FunctionCall = {
//   targetContract: string,
//   sessionKey: string,
//   functionSelector: string,
//   validUntil: number,
//   validFrom: number,
//   arguments: []any,
// }
export const encodeFunctionCallData = async (
  fc: SessionBase.FunctionCallStruct,
  params: any,
  solaceAccount?: SolaceAccount
) => {
  if (params.length !== fc.arguments.length) throw "Invalid Argument Length";
  const encoded = await encodeFunctionCall(fc, solaceAccount);
  const digest = ethers.utils.arrayify(encoded);
  const hashData = ethers.utils.keccak256(digest);

  let dataAndParams = ethers.utils.arrayify(encoded);
  let paramsEncoded = [];
  // Loop over params and concatenate each element with dataAndParams
  for (let i = 0; i < params.length; i++) {
    let argTypeStr = "bytes";
    const argType = fc.arguments[i].argType;
    if (argType === ArgumentType.ADDRESS) {
      argTypeStr = "address";
    } else if (argType === ArgumentType.STRING) {
      argTypeStr = "string";
    } else if (argType === ArgumentType.UINT) {
      argTypeStr = "uint256";
    }
    let packedParam = ethers.utils.solidityPack([argTypeStr], [params[i]]);
    paramsEncoded.push(packedParam);
    dataAndParams = ethers.utils.concat([dataAndParams, packedParam]);
  }
  const hashDataAndParams = ethers.utils.keccak256(dataAndParams);
  const packedData = ethers.utils.solidityPack(["bytes"], [encoded]);
  return {
    hashData,
    hashDataAndParams,
    packedData,
    paramsEncoded,
  };
};

let userEOA = ethers.Wallet.createRandom();
let solaceFactory: SolaceAccountFactory;
let testCounter: TestCounter;
let entryPoint: EntryPoint;
let gameContract: Game;
let paymaster: VerifyingPaymaster;
let admin: Signer;
let boundaryContract: Boundary;
export const setupTest = async () => {
  const [adminS] = await ethers.getSigners();
  if (!admin)
    // @ts-ignore
    admin = adminS as Signer;
  userEOA = userEOA.connect(admin.provider!);
  if (!entryPoint) {
    entryPoint = await deployEntryPoint(adminS.provider);
  }
  if (!testCounter)
    // @ts-ignore
    testCounter = await new TestCounter__factory(admin).deploy();
  const solaceAccountFactory__factory = new SolaceAccountFactory__factory(
    // @ts-ignore
    admin
  );
  if (!solaceFactory)
    solaceFactory = await solaceAccountFactory__factory.deploy(
      entryPoint.address
    );

  if (!gameContract)
    // @ts-ignore
    gameContract = await new Game__factory(admin).deploy();

  // @ts-ignore
  const create2factory = new Create2Factory(admin.provider!, admin);
  const vpf: VerifyingPaymaster__factory = <VerifyingPaymaster__factory>(
    await ethers.getContractFactory("VerifyingPaymaster")
  );
  const addr = await create2factory.deploy(
    await vpf.getDeployTransaction(
      entryPoint.address,
      await admin.getAddress()
    ),
    0
  );
  if (!paymaster)
    paymaster =
      // @ts-ignore
      VerifyingPaymaster__factory.connect(addr, admin);

  // Stake and deposit paymaster with EntryPoint
  await Promise.all([
    paymaster.addStake(1000, {
      value: ethers.utils.parseEther("1000"),
    }),
    paymaster.deposit({ value: ethers.utils.parseEther("1000") }),
  ]);

  if (!boundaryContract)
    boundaryContract = await new Boundary__factory(admin).deploy();
  return {
    pm: paymaster,
    sf: solaceFactory,
    tc: testCounter,
    ep: entryPoint,
    ue: userEOA,
    // @ts-ignore
    ad: admin as Signer,
    gc: gameContract,
    bc: boundaryContract,
  };
};
