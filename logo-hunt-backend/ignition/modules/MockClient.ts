import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";
import { chainAddresses } from '@hyperlane-xyz/registry';
import hre from "hardhat";


const MockClient = buildModule("MockClient", (m) => {
  const network = hre.network.name;
  const config = chainAddresses[network as keyof typeof chainAddresses];
  const hook = m.getParameter("_hook", ethers.ZeroAddress);
  const mailbox = m.getParameter("_mailbox", config.mailbox);
  const mockClient = m.contract("MockClient", [mailbox, hook]);

  return { mockClient };
});

export default MockClient;
