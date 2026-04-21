import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ total, pending, completed }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = percentage === 100 && total > 0;

  return (
    <div className="mt-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/50 relative overflow-hidden group">
      {/* Background glow when complete */}
      {isComplete && (
        <div className="absolute inset-0 bg-emerald-50/30 animate-pulse transition-opacity" />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Upload Progress
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
              {percentage}%
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Real-time synchronization active
          </p>
        </div>

        <div className="flex gap-10">
          <div className="relative">
            <div className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em] mb-1">Total</div>
            <div className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{total.toLocaleString()}</div>
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em] mb-1">Pending</div>
            <div className="text-2xl font-black text-slate-400">{pending.toLocaleString()}</div>
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em] mb-1 decoration-emerald-500/50 underline transition-all">Completed</div>
            <div className="text-2xl font-black text-emerald-600 drop-shadow-sm">{completed.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="relative h-4 w-full bg-slate-100 rounded-2xl overflow-hidden shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`absolute top-0 left-0 h-full rounded-2xl transition-all duration-500 ease-out ${
            isComplete 
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
            : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
          }`}
        />
        
        {/* Animated pulse effect for active movement */}
        {!isComplete && (
          <motion.div
            animate={{ 
              x: ['-20%', '120%'],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute top-0 left-0 h-full w-[30%] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
          />
        )}
      </div>

      {isComplete && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-emerald-600 text-xs font-black uppercase tracking-widest"
        >
          🎉 Job Successfully Completed
        </motion.div>
      )}
    </div>
  );
};

export default ProgressBar;
