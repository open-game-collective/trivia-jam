import { useStore } from '@nanostores/react';
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { $tokenAccount, checkTokenAccount } from '~/stores/token-account';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { TJAM_TOKEN_MINT } from "~/config";
import { Transaction } from "@solana/web3.js";

export const TokenAccountSetup = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const tokenAccount = useStore($tokenAccount);

  // Check token account when wallet connects
  if (publicKey && connection && !tokenAccount.address) {
    checkTokenAccount(publicKey, connection);
  }

  const createAccount = async () => {
    if (!publicKey || !connection) return;

    try {
      $tokenAccount.set({ ...$tokenAccount.get(), isLoading: true, error: null });

      const tokenAccount = await getAssociatedTokenAddress(
        TJAM_TOKEN_MINT,
        publicKey
      );

      const transaction = new Transaction();
      transaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          tokenAccount,
          publicKey,
          TJAM_TOKEN_MINT
        )
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      await checkTokenAccount(publicKey, connection);
    } catch (err) {
      $tokenAccount.set({
        ...$tokenAccount.get(),
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to create token account'
      });
    }
  };

  if (!tokenAccount.exists && !tokenAccount.isLoading) {
    return (
      <motion.button
        onClick={createAccount}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white"
      >
        Create TJAM Account
      </motion.button>
    );
  }

  if (tokenAccount.isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Setting up...
      </div>
    );
  }

  return null;
}; 