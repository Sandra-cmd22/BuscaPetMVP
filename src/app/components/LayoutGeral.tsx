import React from "react";

type LayoutGeralProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  safeBottom?: boolean;
};

export default function LayoutGeral({
  children,
  className,
  contentClassName,
  safeBottom = false,
}: LayoutGeralProps) {
  return (
    <div
      className={`w-full h-[100dvh] flex flex-col bg-white ${className ?? ""}`}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: safeBottom ? "env(safe-area-inset-bottom)" : undefined,
      }}
    >
      <main className={`flex-1 min-h-0 overflow-y-auto ${contentClassName ?? ""}`}>
        {children}
      </main>
    </div>
  );
}