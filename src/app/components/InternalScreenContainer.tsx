import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function InternalScreenContainer({
  children,
  className = "",
}: ContainerProps) {
  return (
    <div className={`w-full px-4 md:px-6 mx-auto ${className}`}>
      {children}
    </div>
  );
}
