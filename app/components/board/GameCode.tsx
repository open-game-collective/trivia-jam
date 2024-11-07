export function GameCode({ code }: { code: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl mb-2">Game Code</h2>
      <div className="text-6xl font-bold tracking-wider">
        {code}
      </div>
    </div>
  );
} 