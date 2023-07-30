import {
  Boundary,
  Boundary__factory,
  Game,
  Game__factory,
  SolaceAccount,
  SolaceAccount__factory,
} from "../../typechain-types";
import { SolaceAccountFactory } from "../../typechain-types/contracts/SolaceAccountFactory.sol";
import {
  EntryPoint,
  EntryPoint__factory,
  ONE_ETH,
  fillAndSign,
  fund,
} from "../utils";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { SolaceAccountFactory__factory } from "../../typechain-types/factories/contracts/SolaceAccountFactory.sol";
import { expect } from "chai";

describe("Vanilla Solace Account", function () {
  let entryPoint: EntryPoint;
  let solaceAccount: SolaceAccount;
  let solaceFactory: SolaceAccountFactory;
  let admin: HardhatEthersSigner;
  let owner: HardhatEthersSigner;
  let boundaryContract: Boundary;

  this.beforeAll(async function () {
    [admin, owner] = await ethers.getSigners();
    // @ts-ignore
    entryPoint = await new EntryPoint__factory(admin).deploy();
    // @ts-ignore
    solaceFactory = await new SolaceAccountFactory__factory(admin).deploy(
      entryPoint.address
    );
    await solaceFactory.createAccount(owner.address, 0);
    const solaceAccountAddress = await solaceFactory.getAddress(
      owner.address,
      0
    );
    solaceAccount = SolaceAccount__factory.connect(solaceAccountAddress);

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
      await entryPoint.handleOps([userOp], owner.address);
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
      await entryPoint.handleOps([userOp1], admin.address);
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
      await entryPoint.handleOps([userOp2], admin.address);
      expect(
        (await boundaryContract.tasks(solaceAccount.address)).points
      ).to.be.eq(100);
    });
  });
});
