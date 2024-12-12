import { motion } from "framer-motion";
import { Copy, ExternalLink } from "lucide-react";

interface WalletInfoProps {
  address: string;
  balance: number;
  onCopy: () => void;
  onDisconnect: () => void;
  copied: boolean;
  fullAddress?: string;
}

export const WalletInfo = ({ 
  address, 
  balance, 
  onCopy, 
  onDisconnect, 
  copied,
  fullAddress 
}: WalletInfoProps) => {
  return (
    <div className="bg-gray-800/50 p-4 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-400">Your Wallet</div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onCopy}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 text-sm"
          >
            <Copy className="w-4 h-4" />
            {copied ? "Copied!" : "Copy"}
          </motion.button>
          <motion.button
            onClick={onDisconnect}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-gray-400 hover:text-gray-300 transition-colors text-sm"
          >
            Disconnect
          </motion.button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="font-mono text-sm text-gray-300">{address}</div>
        <a
          href={`https://explorer.solana.com/address/${fullAddress}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="mt-2 text-sm text-gray-400">Balance: {balance.toFixed(4)} SOL</div>
    </div>
  );
}; 