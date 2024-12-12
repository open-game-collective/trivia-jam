import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { TJAM_TOKEN_AUTHORITY } from "~/config";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { TJAM_TOKEN_MINT } from "~/config";

const MIN_SOL_DEPOSIT = 0.05;
const SOL_TO_TJAM_RATE = 1000;

interface DepositSectionProps {
  hasTokenAccount: boolean;
}

export const DepositSection = ({ hasTokenAccount }: DepositSectionProps) => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [depositAmount, setDepositAmount] = useState<number>(0.1);
  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState(0);

  useEffect(() => {
    if (!publicKey || !connection) return;
    
    const fetchBalance = async () => {
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);
    };

    fetchBalance();
  }, [publicKey, connection]);

  if (!hasTokenAccount) return null;

  const handleDepositChange = (value: number) => {
    const maxDeposit = Math.floor(solBalance * 100) / 100;
    const newAmount = Math.min(value, maxDeposit);
    setDepositAmount(newAmount);
  };

  const handleDeposit = async () => {
    if (!publicKey || !connection || !sendTransaction) return;

    try {
      setIsDepositing(true);
      setError(null);

      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: TJAM_TOKEN_AUTHORITY,
          lamports: depositAmount * LAMPORTS_PER_SOL,
        })
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      // Refresh balance after deposit
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deposit");
    } finally {
      setIsDepositing(false);
    }
  };

  if (!publicKey) return null;

  return (
    <div className="bg-gray-800/50 p-4 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-400">Deposit SOL for TJAM</div>
        <div className="text-sm text-gray-400">
          Rate: 1 SOL = {SOL_TO_TJAM_RATE} TJAM
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => handleDepositChange(Number(e.target.value))}
              min={MIN_SOL_DEPOSIT}
              max={solBalance}
              step={0.1}
              className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white w-full"
              placeholder="SOL amount"
            />
            <div className="mt-1 text-xs text-gray-400">
              Available: {solBalance.toFixed(4)} SOL
            </div>
          </div>
          <div className="text-gray-400 whitespace-nowrap">
            ≈ {(depositAmount * SOL_TO_TJAM_RATE).toFixed(0)} TJAM
          </div>
        </div>

        <motion.button
          onClick={handleDeposit}
          disabled={isDepositing || depositAmount < MIN_SOL_DEPOSIT || depositAmount > solBalance}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full px-4 py-2 rounded-lg text-white font-medium mt-4
            ${(isDepositing || depositAmount < MIN_SOL_DEPOSIT || depositAmount > solBalance)
              ? 'bg-orange-500/50 cursor-not-allowed' 
              : 'bg-orange-500 hover:bg-orange-600'
            }
          `}
        >
          {isDepositing ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Depositing...
            </div>
          ) : depositAmount > solBalance ? (
            'Insufficient SOL balance'
          ) : (
            `Deposit ${depositAmount} SOL for ${(depositAmount * SOL_TO_TJAM_RATE).toFixed(0)} TJAM`
          )}
        </motion.button>
      </div>

      {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
    </div>
  );
};

export default DepositSection;
