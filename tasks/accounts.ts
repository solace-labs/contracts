import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";

task("accounts", "Create a Solace Account", async (_taskArgs, hre) => {
  const signers = await hre.ethers.getSigners();
  const signer = signers[0];
  console.log({ SIGNER: signer.address });
});
