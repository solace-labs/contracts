import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect, use } from "chai";
import { ethers } from "hardhat";
import {
  deployEntryPoint,
  fund,
  simulationResultCatch,
} from "../../stackup/account-abstraction/test/testutils";
import {
  EntryPoint,
  TestCounter,
  TestCounter__factory,
} from "../../stackup/account-abstraction/typechain";
import { VerifyingPaymaster } from "../../stackup/types";
import {
  SolaceAccountFactory,
  SolaceAccount,
  SolaceAccount__factory,
  SolaceAccountFactory__factory,
} from "../../typechain-types";
import { Signer, Wallet } from "ethers";
import {
  MOCK_VALID_AFTER,
  MOCK_VALID_UNTIL,
  UserOperation,
  encodeFunctionCall,
  encodeFunctionCallData,
  encodePaymasterData,
  fillAndSign,
  getPaymasterData,
  setupTest,
} from "../utils";
import { SolaceFactory } from "../../typechain-types/contracts/SolaceAccountFactory.sol";

describe("Counter", async function () {
  let solaceAccount: SolaceAccount;
  let solaceFactory: SolaceAccountFactory;
  let paymaster: VerifyingPaymaster;
  let entryPoint: EntryPoint;
  let userEOA: Wallet;
  let testCounter: TestCounter;
  let admin: Signer;
  this.beforeAll(async function () {
    const { sf, pm, tc, ep, ue, ad } = await setupTest();
    solaceFactory = sf;
    // @ts-ignore
    paymaster = pm;
    entryPoint = ep;
    userEOA = ue;
    testCounter = tc;
    admin = ad;
  });

  it("Should deploy solace account", async function () {
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

    await fund(entryPoint.address);
  });

  it("Should say Hi", async function () {
    const countCall = testCounter.interface.encodeFunctionData("count");
    const callData = solaceAccount.interface.encodeFunctionData("execute", [
      testCounter.address,
      0,
      countCall,
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

    const { returnInfo } = await entryPoint.callStatic
      .simulateValidation(userOp)
      .catch(simulationResultCatch);
    expect(returnInfo.sigFailed).to.be.false;

    // console.log({ sigFailed: returnInfo.sigFailed });
    // const res = await entryPoint.handleOps([userOp], admin.getAddress());
    // await res.wait();
  });

  it("Should test new userop", async function () {
    const countCall = testCounter.interface.encodeFunctionData("count");
    const sessionWallet = ethers.Wallet.createRandom();
    const randoWallet = ethers.Wallet.createRandom();

    await fund(solaceAccount.address);
    await fund(entryPoint.address);

    let functionCall = {
      targetContract: testCounter.address,
      sessionKey: sessionWallet.address,
      functionSelector: ethers.utils.id("count()").substring(0, 10),
      validUntil: 123,
      validFrom: 123,
      arguments: [],
    };

    const { hashData, hashDataAndParams, packedData, paramsEncoded } =
      await encodeFunctionCallData(functionCall, []);

    const userSig = await userEOA.signMessage(ethers.utils.arrayify(hashData));
    const sessionSig = await sessionWallet.signMessage(
      ethers.utils.arrayify(hashDataAndParams)
    );

    const signature = ethers.utils.defaultAbiCoder.encode(
      ["bytes", "bytes", "bytes", "bytes[]"],
      [userSig, sessionSig, packedData, paramsEncoded]
    );

    const callData = solaceAccount.interface.encodeFunctionData("execute", [
      testCounter.address,
      0,
      countCall,
    ]);
    const userOp = await getPaymasterData(
      solaceAccount.address,
      callData,
      // @ts-ignore
      paymaster,
      entryPoint,
      userEOA,
      admin,
      signature
    );
    userOp.signature = signature;

    const { returnInfo } = await entryPoint.callStatic
      .simulateValidation(userOp)
      .catch(simulationResultCatch);

    console.log({ paymaster: paymaster.address });
    console.log({
      fund: ethers.utils.parseEther((await paymaster.getDeposit()).toString()),
    });
    expect(returnInfo.sigFailed).to.be.false;

    // const rx = await entryPoint
    //   .connect(admin)
    //   .handleOps([userOp], admin.getAddress());
    // await rx.wait();
    // expect(
    //   (await testCounter.counters(solaceAccount.address)).toString()
    // ).to.be.eq("2");

    // const res = await entryPoint.callStatic
    //   .simulateHandleOp(
    //     partialUserOp,
    //     testCounter.address,
    //     testCounter.interface.encodeFunctionData("counters", [
    //       solaceAccount.address,
    //     ])
    //   )
    //   .catch((e) => e.errorArgs);
    // console.log({ res });
  });
});
