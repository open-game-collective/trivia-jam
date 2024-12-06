import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { TJAM_TOKEN_MINT } from "~/config";
import { Transaction, type Connection, type PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

interface CreateTokenAccountButtonProps {
  publicKey: PublicKey;
  connection: Connection;
  onSuccess?: () => void;
  buttonText?: string;
}

export const CreateTokenAccountButton = ({ publicKey, connection, onSuccess, buttonText = 'Create Account' }: CreateTokenAccountButtonProps) => {
  const { sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAccount = async () => {
    if (!publicKey || !connection) return;

    try {
      setIsLoading(true);
      setError(null);

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

      onSuccess?.();
    } catch (err) {
      let errorMessage = 'Failed to create token account';
      if (err instanceof Error) {
        if (err.message.includes('debit an account but found no record of a prior credit')) {
          errorMessage = 'You need some SOL to create a token account';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        onClick={createAccount}
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="px-8 py-3 rounded-2xl text-base font-medium bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating...
          </div>
        ) : (
          buttonText
        )}
      </motion.button>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}; 