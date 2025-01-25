import { motion } from "framer-motion";

export const QuestionProgress = ({ 
  current, 
  total 
}: { 
  current: number; 
  total: number;
}) => {
  const progress = (current / total) * 100;
  
  return (
    <div className="fixed top-0 left-0 right-0 p-4 z-50">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-gray-800/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-sm font-medium text-white/70 tabular-nums">
            {current} / {total}
          </div>
        </div>
      </div>
    </div>
  );
}; 