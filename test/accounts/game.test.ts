import { ethers } from "hardhat";
import {
  ArgumentType,
  EntryPoint,
  MOCK_VALID_AFTER,
  MOCK_VALID_UNTIL,
  TestCounter,
  deployEntryPoint,
  encodeFunctionCallData,
  encodePaymasterData,
  fillAndSign,
  fund,
  getPaymasterData,
  getSessionToken,
  getUserOpSignature,
  setupTest,
  simulationResultCatch,
} from "../utils";
import { VerifyingPaymaster } from "../../stackup/types";
import { Signer, Wallet } from "ethers";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  Boundary,
  Game,
  SessionBase,
  SolaceAccount,
  SolaceAccountFactory,
  SolaceAccount__factory,
} from "../../typechain-types";
import { expect } from "chai";

describe("Game Testing", async function () {
  let solaceAccount: SolaceAccount;
  let solaceFactory: SolaceAccountFactory;
  let paymaster: VerifyingPaymaster;
  let entryPoint: EntryPoint;
  let userEOA: Wallet;
  let gameContract: Game;
  let testCounter: TestCounter;
  let admin: Signer;
  let bundler: Signer;
  let boundaryContract: Boundary;
  this.beforeAll(async function () {
    const { sf, pm, gc, ep, ue, ad, tc, bc } = await setupTest();
    solaceFactory = sf;
    // @ts-ignore
    paymaster = pm;
    entryPoint = ep;
    userEOA = ue;
    gameContract = gc;
    admin = ad;
    testCounter = tc;
    boundaryContract = bc;

    const [_, bundlerS] = await ethers.getSigners();
    // @ts-ignore
    bundler = bundlerS;
    const account = await solaceFactory.createAccount(
      await userEOA.getAddress(),
      1234
    );
    await account.wait();
    const solaceUserAddress = await solaceFactory.getAddress(
      userEOA.getAddress(),
      1234
    );
    solaceAccount = SolaceAccount__factory.connect(solaceUserAddress, userEOA);
    // await fund(solaceAccount.address);
    await fund(entryPoint.address);
  });
  it("should create session tokens", async function () {
    const sessionKey = ethers.Wallet.createRandom();
    const startTaskSession = getSessionToken(
      {
        functionSelector: ethers.utils.id("startTask()"),
        targetContract: boundaryContract.address,
        sessionKey: sessionKey.address,
        arguments: [],
        validFrom: 0,
        validUntil: 1000,
      },
      userEOA,
      solaceAccount
    );
  });

  it("Should test the boundary contract", async function () {
    const functionSelector = ethers.utils.id("startTask()").substring(0, 10);
    const points = 90;
    const functionCallData =
      boundaryContract.interface.encodeFunctionData("startTask");
    const sessionKey = Wallet.createRandom();
    const sessionTokenData: SessionBase.FunctionCallStruct = {
      targetContract: boundaryContract.address,
      sessionKey: sessionKey.address,
      functionSelector,
      validFrom: 0,
      validUntil: 100,
      arguments: [
        {
          paramUpperBound: ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [100]
          ),
          paramLowerBound: ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [0]
          ),
          argType: 0,
        },
      ],
    };
    const { hashData, hashDataAndParams, packedData, paramsEncoded } =
      await encodeFunctionCallData(sessionTokenData, [points], solaceAccount);
    const sessionToken = await userEOA.signMessage(
      ethers.utils.arrayify(hashData)
    );
    const sessionKeySig = await sessionKey.signMessage(
      ethers.utils.arrayify(hashDataAndParams)
    );
    const finalSignature = ethers.utils.defaultAbiCoder.encode(
      ["bytes", "bytes", "bytes", "bytes[]"],
      [sessionToken, sessionKeySig, packedData, paramsEncoded]
    );
    const callData = solaceAccount.interface.encodeFunctionData("execute", [
      boundaryContract.address,
      0,
      functionCallData,
    ]);
    const userOp = await getPaymasterData(
      solaceAccount.address,
      callData,
      //@ts-ignore
      paymaster,
      entryPoint,
      userEOA,
      admin
    );
    userOp.signature = finalSignature;

    // const tx = await entryPoint.handleOps([userOp], userEOA.address, {});
    // await tx.wait();
    const { returnInfo } = await entryPoint.callStatic
      .simulateValidation(userOp)
      .catch(simulationResultCatch);
    expect(returnInfo.sigFailed).to.be.false;
  });
});
