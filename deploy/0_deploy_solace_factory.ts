import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const provider = ethers.provider;
  const from = await (await hre.ethers.getSigners())[0].getAddress();

  // @ts-ignore
  await hre.deployments.deploy("SolaceFactory", {
    from,
    log: true,
    deterministicDeployment: true,
  });
};

export default func;
