import React from 'react';

const StatsCards = ({ stats, uploading }) => {
  const cards = [
    { label: 'ALL SKUs', value: stats.all || 0, color: 'text-slate-800', bg: 'bg-white', border: 'border-slate-100 shadow-sm' },
    { label: 'SUCCESS', value: stats.new || 0, color: 'text-emerald-600', bg: 'bg-emerald-50/40', border: 'border-emerald-100', pulse: true },
    { label: 'UPDATED', value: stats.updated || 0, color: 'text-indigo-500', bg: 'bg-indigo-50/30', border: 'border-indigo-100' },
    { label: 'ERRORS', value: stats.errors || 0, color: 'text-rose-500', bg: 'bg-rose-50/40', border: 'border-rose-100', pulse: true },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${card.bg} ${card.border} min-h-[95px] transition-all duration-500 hover:shadow-md ${uploading && card.pulse ? 'animate-pulse' : ''}`}
        >
          <span className={`text-3xl font-black tabular-nums ${card.color} transition-all duration-300`}>
            {card.value}
          </span>
          <span className="text-[10px] font-extrabold text-slate-400 tracking-widest mt-1 uppercase opacity-80">
            {card.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
