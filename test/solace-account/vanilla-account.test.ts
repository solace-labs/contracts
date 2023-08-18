import {
  Boundary,
  Boundary__factory,
  SolaceAccount,
  SolaceAccountFactory,
  SolaceAccountFactory__factory,
  SolaceAccount__factory,
} from "../../typechain-types";
import {
  EntryPoint,
  EntryPoint__factory,
  ONE_ETH,
  fillAndSign,
  fund,
} from "../utils";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { expect } from "chai";

describe("Vanilla Solace Account", function () {
  let entryPoint: EntryPoint;
  let solaceAccount: SolaceAccount;
  let solaceFactory: SolaceAccountFactory;
  let admin: Signer;
  let owner: Signer;
  let boundaryContract: Boundary;

  this.beforeAll(async function () {
    [admin as Signer, owner as Signer] = await ethers.getSigners();
    // @ts-ignore
    entryPoint = await new EntryPoint__factory(admin).deploy();
    solaceFactory = await new SolaceAccountFactory__factory(admin).deploy(
      entryPoint.address
    );
    await solaceFactory.createAccount(await owner.getAddress(), 0);
    const solaceAccountAddress = await solaceFactory.getAddress(
      await owner.getAddress(),
      0
    );
    solaceAccount = SolaceAccount__factory.connect(solaceAccountAddress, owner);

    // @ts-ignore
    boundaryContract = await new Boundary__factory(admin).deploy();
  });

  it("owner should be able to call transfer", async function () {
    await fund(solaceAccount.address);
    const randomWallet = ethers.Wallet.createRandom();
    await solaceAccount
      .connect(owner)
      .execute(randomWallet.address, ONE_ETH, "0x");
    await expect(
      await ethers.provider.getBalance(randomWallet.address)
    ).to.be.eq(ONE_ETH);
  });

  it("other account should be not able to call transfer", async function () {
    await fund(solaceAccount.address);
    const randomWallet = ethers.Wallet.createRandom();
    await expect(
      solaceAccount.connect(admin).execute(randomWallet.address, ONE_ETH, "0x")
    ).to.be.rejectedWith();
  });
  describe("validateUserOps", async function () {
    this.beforeAll(async function () {});
    it("Valid userOps should execute successfully", async function () {
      // @ts-ignore
      let walletOwner = owner as Signer;
      const randomWallet = ethers.Wallet.createRandom();
      const callData = solaceAccount.interface.encodeFunctionData("execute", [
        randomWallet.address,
        ONE_ETH,
        "0x",
      ]);
      await fund(solaceAccount.address);
      const userOp = await fillAndSign(
        {
          sender: solaceAccount.address,
          callData,
        },
        walletOwner,
        entryPoint
      );
      const preBalance = await ethers.provider.getBalance(randomWallet.address);
      await entryPoint.handleOps([userOp], await owner.getAddress());
      const postBalance = await ethers.provider.getBalance(
        randomWallet.address
      );
      expect(preBalance.toString()).to.be.eq("0");
      expect(postBalance).to.be.eq(ONE_ETH);
    });
    it("Should call an external contract successfully", async function () {
      // @ts-ignore
      let walletOwner = owner as Signer;
      const functionCallData1 =
        boundaryContract.interface.encodeFunctionData("startTask");
      const callData1 = solaceAccount.interface.encodeFunctionData("execute", [
        boundaryContract.address,
        0,
        functionCallData1,
      ]);

      const userOp1 = await fillAndSign(
        {
          sender: solaceAccount.address,
          callData: callData1,
        },
        walletOwner,
        entryPoint
      );
      await entryPoint.handleOps([userOp1], await admin.getAddress());
      expect(
        (await boundaryContract.tasks(solaceAccount.address)).state
      ).to.be.eq(1);

      // Call the next method of the boundary contract to check that msg.sender is working well
      const functionCallData2 = boundaryContract.interface.encodeFunctionData(
        "checkPoint",
        [100]
      );
      const callData2 = solaceAccount.interface.encodeFunctionData("execute", [
        boundaryContract.address,
        0,
        functionCallData2,
      ]);
      const userOp2 = await fillAndSign(
        {
          callData: callData2,
          sender: solaceAccount.address,
        },
        walletOwner,
        entryPoint
      );
      await entryPoint.handleOps([userOp2], await admin.getAddress());
      expect(
        (await boundaryContract.tasks(solaceAccount.address)).points
      ).to.be.eq(100);
    });
  });
});
