// Flow blockchain configuration
export const FLOW_CONFIG = {
  testnet: {
    accessNode: "https://rest-testnet.onflow.org",
    discoveryWallet: "https://fcl-discovery.onflow.org/testnet/authn",
    network: "testnet"
  },
  mainnet: {
    accessNode: "https://rest-mainnet.onflow.org", 
    discoveryWallet: "https://fcl-discovery.onflow.org/authn",
    network: "mainnet"
  }
}

export const getCurrentNetwork = () => {
  return process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet"
}

export const getFlowConfig = () => {
  const network = getCurrentNetwork()
  return FLOW_CONFIG[network as keyof typeof FLOW_CONFIG]
}