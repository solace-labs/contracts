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

    console.log(await paymaster.owner());
    console.log(await admin.getAddress());

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
  it("should start task", async function () {
    const sessionWallet = ethers.Wallet.createRandom();
    let functionCall: SessionBase.FunctionCallStruct = {
      targetContract: gameContract.address,
      sessionKey: sessionWallet.address,
      functionSelector: ethers.utils
        .id("startTask(uint256,uint256)")
        .substring(0, 10),
      arguments: [
        {
          argType: 0,
          paramLowerBound: ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [0]
          ),
          paramUpperBound: ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [100]
          ),
        },
        {
          argType: 0,
          paramLowerBound: ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [0]
          ),
          paramUpperBound: ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [100]
          ),
        },
      ],
      validUntil: 123,
      validFrom: 123,
    };
    const { packedData, paramsEncoded, hashData, hashDataAndParams } =
      await encodeFunctionCallData(functionCall, [10, 2]);

    const sessionToken = await userEOA.signMessage(
      ethers.utils.arrayify(hashData)
    );
    const sessionSig = await sessionWallet.signMessage(
      ethers.utils.arrayify(hashDataAndParams)
    );

    const signature = ethers.utils.defaultAbiCoder.encode(
      ["bytes", "bytes", "bytes", "bytes[]"],
      [sessionToken, sessionSig, packedData, paramsEncoded]
    );

    const gameFunctionCallData = gameContract.interface.encodeFunctionData(
      "startTask",
      [10, 2]
    );
    const callData = solaceAccount.interface.encodeFunctionData("execute", [
      gameContract.address,
      0,
      gameFunctionCallData,
    ]);
    const userOp = await getPaymasterData(
      solaceAccount.address,
      callData,
      // @ts-ignore
      paymaster,
      entryPoint,
      userEOA,
      admin
    );
    // const userOp = await fillAndSign(
    //   {
    //     sender: solaceAccount.address,
    //     callData,
    //   },
    //   bundler,
    //   entryPoint
    // );
    userOp.verificationGasLimit = 10000000;
    userOp.signature = signature;
    const { returnInfo } = await entryPoint.callStatic
      .simulateValidation(userOp)
      .catch(simulationResultCatch);
    console.log({ sigFailed: returnInfo.sigFailed });
    // expect(returnInfo.sigFailed).to.be.false;
  });

  it("Should test the boundary contract", async function () {
    const functionSelector = ethers.utils
      .id("setValue(uint256)")
      .substring(0, 10);
    const value = 90;
    const functionCallData = boundaryContract.interface.encodeFunctionData(
      "setValue",
      [value]
    );
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
      await encodeFunctionCallData(sessionTokenData, [value], solaceAccount);
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
