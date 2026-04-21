import React from 'react';
import { PlusCircle, XCircle, Clock } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const configs = {
    VALID: {
      label: 'VALID',
      icon: <PlusCircle className="w-4 h-4" />,
      colors: 'text-emerald-500 bg-emerald-50 border-emerald-100',
    },
    INVALID: {
      label: 'INVALID',
      icon: <XCircle className="w-4 h-4" />,
      colors: 'text-rose-500 bg-rose-50 border-rose-100',
    },
    PENDING: {
      label: 'PENDING',
      icon: <Clock className="w-4 h-4" />,
      colors: 'text-gray-400 bg-gray-50 border-gray-100',
    },
  };

  const config = configs[status] || configs.PENDING;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[13px] font-medium transition-all ${config.colors}`}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};

export default StatusBadge;
