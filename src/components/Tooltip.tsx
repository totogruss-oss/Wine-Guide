import React, { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 transition-opacity group-hover:opacity-100 z-50 w-max max-w-[250px]">
        <div className="bg-[#37352f] text-white text-xs rounded py-1.5 px-2.5 shadow-md text-center break-words">
          {content}
        </div>
        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#37352f] absolute left-1/2 -translate-x-1/2"></div>
      </div>
    </div>
  );
}
