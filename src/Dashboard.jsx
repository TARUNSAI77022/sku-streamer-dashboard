import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X, Paperclip, Upload, Loader2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import StatsCards from './components/StatsCards';
import SKUListTable from './components/SKUListTable';

const Dashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('--- No File ---');
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Socket initialization
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 2000,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Socket connected');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Socket disconnected');
    });

    // REAL WORLD PROTECTION: Check browser hardware status
    const handleNetworkChange = () => {
      if (!navigator.onLine) {
        setIsConnected(false);
        console.log('🌐 Hardware Offline: Forcing connection lost state');
      } else {
        // Socket.io will automatically reconnect, 'connect' listener will set to true
      }
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    socketRef.current.on('uploadProgress', (payload) => {
      console.log(`[WS] Received Progress: ${payload.progress}%`, payload);
      setProgress(payload.progress);
      
      // LIVE STREAM: Append new records to the UI immediately
      if (payload.newRecords && payload.newRecords.length > 0) {
        setData((prev) => [...payload.newRecords, ...prev]); 
      }
    });

    fetchData(pagination.page);

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/sku-uploads?page=${page}&limit=50`);
      const json = await res.json();
      setData(json.records);
      setPagination(json.pagination);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validation: .xlsx and Max 5MB
    if (!file.name.endsWith('.xlsx')) {
      alert('Please upload only .xlsx files.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setProgress(0);
    setData([]); // Clear table for live streaming
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      await fetchData(1); // Reset to page 1 to see new data
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchData(newPage);
    }
  };

  const stats = {
    all: pagination.total,
    new: data.filter(d => d.status === 'VALID').length, // This is current page only, ideally backend provides total valid/invalid
    updated: 0,
    errors: data.filter(d => d.status === 'INVALID').length
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4 font-['Inter',_sans-serif]">
      <div className="w-full max-w-[580px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-100 flex flex-col">
        
        {/* Header Section */}
        <div className="flex items-center justify-between px-8 py-7">
          <div className="flex items-center gap-4">
            <ArrowLeft className="w-6 h-6 text-gray-400 cursor-pointer" />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Product SKUs</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isConnected ? 'Real-time Connected' : 'Connection Lost'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-xl text-blue-500 text-[11px] font-bold">
              <Paperclip className="w-3.5 h-3.5 rotate-45" />
              <span className="truncate max-w-[130px]">{fileName}</span>
            </div>
            {fileName !== '--- No File ---' && !uploading && (
              <X 
                className="w-5 h-5 text-gray-300 cursor-pointer hover:text-rose-500" 
                onClick={() => { setFileName('--- No File ---'); setData([]); }}
              />
            )}
          </div>
        </div>

        <div className="px-8 pb-8">
          <StatsCards stats={stats} />

          <div className="mt-2 min-h-[420px]">
            {loading && !uploading ? (
              <div className="flex flex-col items-center justify-center min-h-[350px]">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Loading...</p>
              </div>
            ) : (
              <>
                <SKUListTable items={data} />
                
                {/* Pagination Controls */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-4 px-2">
                    <p className="text-[11px] font-bold text-gray-400 tracking-tighter">
                      PAGE {pagination.page} OF {pagination.pages}
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="p-1.5 rounded-md border border-gray-100 hover:bg-slate-50 disabled:opacity-30 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-600" />
                      </button>
                      <button 
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="p-1.5 rounded-md border border-gray-100 hover:bg-slate-50 disabled:opacity-30 transition-all"
                      >
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-800">Skus Upload</h3>
                <span className="text-[14px] font-semibold text-gray-400 font-sans tracking-tight">
                  {uploading ? `(${progress}% Complete)` : pagination.total > 0 ? '(Synced Settings)' : '(0% Complete)'}
                </span>
              </div>
              <button 
                onClick={triggerFileUpload}
                disabled={uploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-[13px] font-bold transition-all disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Processing...' : 'Upload File'}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx" className="hidden" />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-500 text-[12px] font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="relative h-2 w-full bg-gray-100 rounded-full mb-6 overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300"
                style={{ width: uploading ? `${progress}%` : pagination.total > 0 ? '100%' : '0%' }}
              />
            </div>

            <div className="grid grid-cols-3 text-center border-t border-gray-50 pt-6">
              <div>
                <p className="text-[12px] font-bold text-gray-400 tracking-wider mb-1 uppercase">Total</p>
                <p className="text-[20px] font-black text-slate-800 tracking-tight">{pagination.total}</p>
              </div>
              <div>
                <p className="text-[12px] font-bold text-gray-400 tracking-wider mb-1 uppercase">Success</p>
                <p className="text-[20px] font-black text-emerald-500 tracking-tight">{data.filter(d=>d.status==='VALID').length}</p>
              </div>
              <div>
                <p className="text-[12px] font-bold text-gray-400 tracking-wider mb-1 uppercase">Failed</p>
                <p className="text-[20px] font-black text-rose-500 tracking-tight">{data.filter(d=>d.status==='INVALID').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
