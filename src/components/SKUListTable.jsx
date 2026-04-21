import React from 'react';
import { Inbox } from 'lucide-react';
import StatusBadge from './StatusBadge';

const SKUListTable = ({ items }) => {
  return (
    <div className="w-full">
      {/* Table Header Section */}
      <div className="bg-[#f8f9fa] rounded-xl flex items-center px-6 py-4 mb-2 shadow-sm border border-gray-50">
        <div className="flex-[2] text-[15px] font-bold text-slate-800">Client Name</div>
        <div className="flex-[1] text-[15px] font-bold text-slate-800 text-center">SKU</div>
        <div className="flex-[1] text-[15px] font-bold text-slate-800 text-center">Status</div>
      </div>

      {/* Table Body Section */}
      <div className="min-h-[300px] max-h-[400px] overflow-y-auto bg-white rounded-xl border border-gray-100 p-2">
        {items && items.length > 0 ? (
          <div className="flex flex-col gap-2">
            {items.map((item, index) => (
              <div key={item._id || index} className="flex items-center px-4 py-3 rounded-lg border border-gray-50 hover:bg-slate-50 transition-colors">
                <div className="flex-[2] text-[13px] font-semibold text-slate-700 text-left truncate">{item.clientName}</div>
                <div className="flex-[1] text-[13px] font-mono font-bold text-slate-500 text-center">{item.skuId}</div>
                <div className="flex-[1] flex justify-center">
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center opacity-30">
            <Inbox className="w-12 h-12 mb-3 text-slate-400" />
            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">No SKUs Processed</p>
            <p className="text-[11px] text-slate-400 font-medium">Upload a file to begin synchronization</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SKUListTable;
