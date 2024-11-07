export function BuzzerButton({ 
  onBuzz, 
  disabled 
}: { 
  onBuzz: () => void;
  disabled: boolean;
}) {
  return (
    <button
      className={`w-48 h-48 rounded-full ${
        disabled 
          ? 'bg-gray-500' 
          : 'bg-secondary hover:bg-secondary-dark'
      }`}
      onClick={onBuzz}
      disabled={disabled}
    >
      <span className="text-2xl font-bold">
        {disabled ? 'Wait...' : 'BUZZ!'}
      </span>
    </button>
  );
} 