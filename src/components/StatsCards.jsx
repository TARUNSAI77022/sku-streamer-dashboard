import React from 'react';

const StatsCards = ({ stats }) => {
  const cards = [
    { label: 'ALL SKUs', value: stats.all || 0, color: 'text-blue-500', bg: 'bg-white', border: 'border-blue-200 shadow-sm shadow-blue-50' },
    { label: 'NEW SKUs', value: stats.new || 0, color: 'text-emerald-500', bg: 'bg-emerald-50/30', border: 'border-emerald-100' },
    { label: 'UPDATED', value: stats.updated || 0, color: 'text-blue-300', bg: 'bg-blue-50/20', border: 'border-blue-50' },
    { label: 'ERRORS', value: stats.errors || 0, color: 'text-rose-300', bg: 'bg-rose-50/20', border: 'border-rose-50' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`flex flex-col items-center justify-center p-3 rounded-xl border ${card.bg} ${card.border} min-h-[80px]`}
        >
          <span className={`text-2xl font-bold ${card.color}`}>{card.value}</span>
          <span className="text-[10px] font-bold text-gray-400 tracking-tight">{card.label}</span>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
