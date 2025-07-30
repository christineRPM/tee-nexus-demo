import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";
import { chainAddresses } from '@hyperlane-xyz/registry';
import hre from "hardhat";


const LogoHuntGame = buildModule("LogoHuntGame", (m) => {
  const network = hre.network.name;
  const config = chainAddresses[network as keyof typeof chainAddresses];
  const hook = m.getParameter("_hook", ethers.ZeroAddress);
  const mailbox = m.getParameter("_mailbox", config.mailbox);
  const logoHuntGame = m.contract("LogoHuntGame", [mailbox, hook]);

  return { logoHuntGame };
});

export default LogoHuntGame; 