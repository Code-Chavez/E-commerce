import React from 'react';
import { Building2 } from 'lucide-react';

interface CrossBranchTagProps {
  branchName: string;
}

export const CrossBranchTag: React.FC<CrossBranchTagProps> = ({ branchName }) => {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
      <Building2 className="w-3 h-3 shrink-0" />
      <span>Sede: {branchName}</span>
    </span>
  );
};
