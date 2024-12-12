import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { motion } from "framer-motion";
import { Loader2, ExternalLink, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { TJAM_TOKEN_MINT } from "~/config";
import { CreateTokenAccountButton } from './create-token-account-button';
import { Drawer } from 'vaul';
import DepositSection from "./deposit-section";

interface TokenAccountState {
  exists: boolean;
  balance: number;
  isInitialized: boolean;
  address?: string;
}

export const TokenBalance = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenAccount, setTokenAccount] = useState<TokenAccountState>({ 
    exists: false, 
    balance: 0,
    isInitialized: false,
    address: undefined
  });
  const [showDeposit, setShowDeposit] = useState(false);

  const fetchBalance = async () => {
    if (!publicKey || !connection) return;

    try {
      setIsLoading(true);
      setError(null);

      const tokenAccountAddress = await getAssociatedTokenAddress(
        TJAM_TOKEN_MINT,
        publicKey
      );

      const accountInfo = await connection.getAccountInfo(tokenAccountAddress);
      
      if (accountInfo) {
        const tokenBalance = await connection.getTokenAccountBalance(tokenAccountAddress);
        setTokenAccount({
          exists: true,
          balance: Number(tokenBalance.value.uiAmount || 0),
          isInitialized: true,
          address: tokenAccountAddress.toString()
        });
      } else {
        setTokenAccount({
          exists: false,
          balance: 0,
          isInitialized: true,
          address: tokenAccountAddress.toString()
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey && connection) {
      fetchBalance();
    } else {
      setTokenAccount({ exists: false, balance: 0, isInitialized: false, address: undefined });
    }
  }, [publicKey, connection]);

  if (!publicKey) return null;

  // Show loading state while checking account status
  if (!tokenAccount.isInitialized || isLoading) {
    return (
      <div className="bg-gray-800/50 p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">TJAM Balance</div>
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            {tokenAccount.isInitialized ? 'Refreshing...' : 'Checking account...'}
          </div>
        </div>
      </div>
    );
  }

  // Show only the create wallet button if account doesn't exist
  if (!tokenAccount.exists) {
    return (
      <div className="flex justify-center mt-4">
        <CreateTokenAccountButton 
          publicKey={publicKey} 
          connection={connection} 
          onSuccess={fetchBalance}
          buttonText="Create Account to Join"
        />
      </div>
    );
  }

  // Show balance section if account exists
  return (
    <div className="space-y-4">
      <Drawer.Root>
        <div className="bg-gray-800/50 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <div className="text-sm text-gray-400">TJAM Balance</div>
                <motion.button
                  onClick={fetchBalance}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </motion.button>
              </div>
              <div className="mt-1.5 text-2xl font-bold">{tokenAccount.balance} TJAM</div>
            </div>
            
            <Drawer.Trigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-full aspect-square bg-orange-500 hover:bg-orange-600 text-white rounded-xl p-3 flex items-center justify-center transition-colors"
              >
                <Plus className="w-6 h-6" />
              </motion.button>
            </Drawer.Trigger>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="text-xs text-gray-500 font-mono truncate">
              {tokenAccount.address?.slice(0, 12)}...{tokenAccount.address?.slice(-8)}
            </div>
            <a
              href={`https://explorer.solana.com/address/${tokenAccount.address}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {error && (
            <div className="mt-2 text-sm text-red-400">{error}</div>
          )}
        </div>

        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 outline-none bg-gray-800/95 backdrop-blur-sm border-t border-gray-700/50 z-50">
            <div className="flex flex-col max-w-2xl mx-auto">
              {/* Drag handle */}
              <div className="flex justify-center pt-4">
                <div className="w-12 h-1 bg-gray-600 rounded-full" />
              </div>

              {/* Title */}
              <div className="px-6 pt-4 pb-6">
                <h2 className="text-xl font-semibold text-gray-200">
                  Deposit SOL for TJAM
                </h2>
              </div>

              {/* Content */}
              <div className="px-6 pb-8">
                <DepositSection hasTokenAccount={tokenAccount.exists} />
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}; 