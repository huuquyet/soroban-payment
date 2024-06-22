import type { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit'

export interface NetworkDetails {
  network: string
  networkUrl: string
  networkPassphrase: string
}

// Soroban is only supported on Futurenet right now
export const FUTURENET_DETAILS = {
  network: 'FUTURENET',
  networkUrl: 'https://horizon-futurenet.stellar.org',
  networkPassphrase: 'Test SDF Future Network ; October 2022',
}

export const TESTNET_DETAILS = {
  network: 'TESTNET',
  networkUrl: 'https://horizon-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
}

export const signTx = async (xdr: string, publicKey: string, kit: StellarWalletsKit) => {
  const { signedXDR } = await kit.sign({
    xdr,
    publicKey,
  })
  return signedXDR
}
