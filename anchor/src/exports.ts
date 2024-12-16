// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import TriviajamIDL from '../target/idl/triviajam.json'
import type { Triviajam } from '../target/types/triviajam'

// Re-export the generated IDL and type
export { Triviajam, TriviajamIDL }

// The programId is imported from the program IDL.
export const TRIVIAJAM_PROGRAM_ID = new PublicKey(TriviajamIDL.address)

// This is a helper function to get the Triviajam Anchor program.
export function getTriviajamProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...TriviajamIDL, address: address ? address.toBase58() : TriviajamIDL.address } as Triviajam, provider)
}

// This is a helper function to get the program ID for the Triviajam program depending on the cluster.
export function getTriviajamProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Triviajam program on devnet and testnet.
      return new PublicKey('Aqvh4Xd9QZDeX6KrTXprZeRs7H161rmac3u4wdY1bhge')
    case 'mainnet-beta':
    default:
      return TRIVIAJAM_PROGRAM_ID
  }
}
