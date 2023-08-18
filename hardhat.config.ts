import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "tsconfig-paths/register";
import "./tasks";
import "hardhat-preprocessor";
import "dotenv/config";

console.log("PENV", process.env.abc);
const config: HardhatUserConfig = {
  solidity: "0.8.19",
  defaultNetwork: "hardhat",
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v5",
  },
  networks: {
    localhost: {
      url: "http://localhost:8545",
    },
    mumbai: {
      url: process.env.RPC_MUMBAI || "",
      accounts: [process.env.PRIVATE_KEY || ""],
    },
    fuji: {
      url: process.env.RPC_FUJI || "",
      accounts: [process.env.PRIVATE_KEY || ""],
    },
    binance: {
      url: process.env.RPC_BINANCE || "",
      accounts: [process.env.PRIVATE_KEY || ""],
    },
    cronos: {
      url: process.env.RPC_CRONOS || "",
      accounts: [process.env.PRIVATE_KEY || ""],
    },
  },
};

export default config;
