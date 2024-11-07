import { type PropsWithChildren } from "react";

export function GameLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-dark text-white">
      {children}
    </div>
  );
} 