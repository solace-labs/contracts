import { ethers } from "hardhat";
import { EntryPoint__factory } from "../test/utils";
import { SolaceAccountFactory__factory } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  // @ts-ignore
  const entryPoint = await new EntryPoint__factory(signer).deploy();

  console.log("EntryPoint Address", entryPoint.address);

  // @ts-ignore
  const solaceFactory = await new SolaceAccountFactory__factory(signer).deploy(
    entryPoint.address
  );
  await solaceFactory.deployed();
  console.log("SolaceFactory Address", solaceFactory.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
