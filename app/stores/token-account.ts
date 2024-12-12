import { atom } from 'nanostores';
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { TJAM_TOKEN_MINT } from "~/config";
import type { PublicKey } from '@solana/web3.js';

export interface TokenAccountState {
  address: string | null;
  exists: boolean;
  balance: number;
  isLoading: boolean;
  error: string | null;
}

export const $tokenAccount = atom<TokenAccountState>({
  address: null,
  exists: false,
  balance: 0,
  isLoading: false,
  error: null
});

export async function checkTokenAccount(publicKey: PublicKey, connection: any) {
  try {
    $tokenAccount.set({ ...$tokenAccount.get(), isLoading: true, error: null });
    
    const tokenAccount = await getAssociatedTokenAddress(
      TJAM_TOKEN_MINT,
      publicKey
    );

    const accountInfo = await connection.getAccountInfo(tokenAccount);
    
    if (accountInfo) {
      const tokenBalance = await connection.getTokenAccountBalance(tokenAccount);
      $tokenAccount.set({
        address: tokenAccount.toString(),
        exists: true,
        balance: Number(tokenBalance.value.uiAmount || 0),
        isLoading: false,
        error: null
      });
    } else {
      $tokenAccount.set({
        address: tokenAccount.toString(),
        exists: false,
        balance: 0,
        isLoading: false,
        error: null
      });
    }
  } catch (err) {
    $tokenAccount.set({
      ...$tokenAccount.get(),
      isLoading: false,
      error: err instanceof Error ? err.message : 'Failed to check token account'
    });
  }
} 