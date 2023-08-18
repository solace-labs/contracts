import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { SolaceAccountFactory__factory } from "../typechain-types";
import { EntryPoint__factory, fund } from "../test/utils";
import {
  VerifyingPaymaster__factory,
  VerifyingPaymaster,
} from "@solacelabs/typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const deployPaymaster = async (
  entryPointAddress: string,
  signer: SignerWithAddress
): Promise<string> => {
  // // Paymaster + Funding
  const paymaster = await new VerifyingPaymaster__factory(signer).deploy(
    entryPointAddress,
    await signer.getAddress()
  );
  const paymasterDeployed = await paymaster.deployed();
  console.log("PayMaster deployed at - ", paymaster.address);
  return paymaster.address;
};
// -------------
const depositEntrypoint = async (
  entryPointAddress: string,
  paymasterAddress: string,
  signer: SignerWithAddress
) => {
  const entrypoint = EntryPoint__factory.connect(entryPointAddress, signer);
  const tx = await entrypoint.depositTo(paymasterAddress, {
    value: ethers.utils.parseEther("0.01"),
  });
  await tx.wait();
  console.log(await entrypoint.getDepositInfo(paymasterAddress));
  console.log("Funded paymaster");
};

const deployEntrypoint = async (signer: SignerWithAddress): Promise<string> => {
  const ep = await new EntryPoint__factory(signer).deploy();
  console.log("Deployed Entrypoint-", ep.address);
  return ep.address;
};

const deploySolaceFactory = async (
  entryPointAddress: string,
  signer: SignerWithAddress
): Promise<string> => {
  // Deploying factory
  const solaceFactory = await new SolaceAccountFactory__factory(signer).deploy(
    entryPointAddress
  );
  await solaceFactory.deployed();
  console.log("Solace Factory Deployed - ", solaceFactory.address);
  return solaceFactory.address;
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const [signer] = await ethers.getSigners();
  // const entryPointAddress = process.env.ENTRYPOINT_ADDRESS;
  const entryPointAddress = await deployEntrypoint(signer);

  if (!entryPointAddress)
    throw "Entry Point Contract address needs to be provided in the ENV";

  // const paymasterAddress = "0x56Af0BCe30523b0e3d5b0370cE1d37C7DDdeCC7F";
  // const paymasterAddress = "0x977593C83d3A6b7dd9e20daa2edC4121ee1a7324";
  const paymasterAddress = await deployPaymaster(entryPointAddress, signer);

  const solaceFactoryAddress = await deploySolaceFactory(
    entryPointAddress,
    signer
  );
  await depositEntrypoint(entryPointAddress, paymasterAddress, signer);
};

export default func;
