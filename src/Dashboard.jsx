import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X, Paperclip, Upload, Loader2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import StatsCards from './components/StatsCards';
import SKUListTable from './components/SKUListTable';

const Dashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [activeJobId, setActiveJobId] = useState(null);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('--- No File ---');
  const [stats, setStats] = useState({ all: 0, new: 0, updated: 0, errors: 0 });
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    socketRef.current = io(SOCKET_URL, {
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5
    });

    socketRef.current.on('connect', async () => {
      setIsConnected(true);
      setSocketId(socketRef.current.id);
      console.log('✅ Connected/Syncing:', socketRef.current.id);
      
      const savedJobId = localStorage.getItem('activeJobId');
      if (savedJobId) {
        socketRef.current.emit('joinJob', savedJobId);
        
        try {
          const response = await fetch(`${API_BASE_URL}/jobs/${savedJobId}`);
          if (response.ok) {
            const jobData = await response.json();
            console.log('🔄 Syncing from DB:', jobData);
            setProgress(jobData.progress);
            setStats({
              all: jobData.totalRows,
              new: jobData.result?.valid || 0,
              updated: 0,
              errors: jobData.result?.invalid || 0
            });
            setActiveJobId(savedJobId);
            setUploading(jobData.status === 'PROCESSING');
          }
        } catch (err) {
          console.error('❌ Failed to sync job state:', err);
        }
      }
    });

    socketRef.current.on('reconnect_attempt', () => {
      console.log('📡 Attempting to reconnect...');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      setSocketId(null);
      console.log('❌ Socket disconnected');
    });

    socketRef.current.on('uploadProgress', (payload) => {
      console.log(`[WS] Received Progress: ${payload.progress}%`, payload);
      setProgress(payload.progress);
      
      setStats(prev => ({ 
        ...prev, 
        all: payload.totalRows,
        new: payload.newRecords && payload.newRecords[0].status === 'VALID' ? prev.new + 1 : prev.new,
        errors: payload.newRecords && payload.newRecords[0].status === 'INVALID' ? prev.errors + 1 : prev.errors
      }));
      
      if (payload.newRecords && payload.newRecords.length > 0) {
        setData((prev) => {
          // Safety Check: Ensure prev is an array before spreading
          const currentData = Array.isArray(prev) ? prev : [];
          return [...payload.newRecords, ...currentData];
        }); 
      }

      if (payload.progress === 100) {
        localStorage.removeItem('activeJobId');
        setActiveJobId(null);
        setTimeout(() => setUploading(false), 2000);
      }
    });

    // Recovery sequence
    const recoverJob = async () => {
      const savedJobId = localStorage.getItem('activeJobId');
      if (savedJobId) {
        setActiveJobId(savedJobId);
        try {
          const res = await fetch(`${API_BASE}/jobs/${savedJobId}`);
          if (res.ok) {
            const job = await res.json();
            if (job.status === 'PROCESSING') {
              setUploading(true);
              setProgress(job.progress);
              setFileName(job.fileName);
              setStats({ all: job.totalRows, new: job.result.valid, updated: 0, errors: job.result.invalid });
              socketRef.current.emit('joinJob', savedJobId);
            }
          }
        } catch (e) { console.error(e); }
      }
    };

    recoverJob();
    fetchData(pagination.page);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchData = async (page) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sku-uploads?page=${page}&limit=${pagination.limit}`);
      const result = await res.json();
      setData(result.data);
      setPagination({
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        pages: result.pagination.pages
      });
      // If not uploading, set stats from pagination total
      if (!uploading) {
        setStats(prev => ({ ...prev, all: result.pagination.total }));
      }
    } catch (e) { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handlePageChange = (newPage) => {
    fetchData(newPage);
  };

  const triggerFileUpload = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.current?.files?.[0] || event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setProgress(0);
    setStats({ all: 0, new: 0, updated: 0, errors: 0 });
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('socketId', socketRef.current.id);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('activeJobId', result.jobId);
        setActiveJobId(result.jobId);
        socketRef.current.emit('joinJob', result.jobId);
      } else {
        setError(result.error || 'Upload failed');
        setUploading(false);
      }
    } catch (err) {
      setError('Connection error');
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-200">
              <ArrowLeft className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Product SKUs</h1>
              <div className="flex flex-col gap-0.5 mt-0.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-bounce'}`}></div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isConnected ? `Server Connected` : 'Attempting Reconnection...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-xl text-blue-500 text-[11px] font-bold">
              <Paperclip className="w-3.5 h-3.5 rotate-45" />
              <span className="truncate max-w-[130px]">{fileName}</span>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
          <StatsCards stats={stats} uploading={uploading} />

          <div className="mt-2 min-h-[420px]">
            {loading && !uploading ? (
              <div className="flex flex-col items-center justify-center min-h-[350px]">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Loading Data...</p>
              </div>
            ) : (
              <>
                <SKUListTable items={data} />
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-4 px-2">
                    <p className="text-[11px] font-bold text-gray-400 tracking-tighter">
                      PAGE {pagination.page} OF {pagination.pages}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="p-1.5 rounded-md border border-gray-100 hover:bg-slate-50 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="p-1.5 rounded-md border border-gray-100 hover:bg-slate-50 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-800">Skus Upload</h3>
                  <span className="text-[13px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg">
                    {uploading ? `${progress}%` : 'Ready'}
                  </span>
                </div>
                {uploading && <p className="text-[11px] text-slate-400 font-medium mt-1 italic">Uploading rows in background...</p>}
              </div>
              
              <button 
                onClick={triggerFileUpload}
                disabled={uploading}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-[14px] font-bold transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Processing File...' : 'Upload Excel File'}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx" className="hidden" />
            </div>

            {uploading && (
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-500 text-[12px] font-bold flex items-center gap-2 animate-bounce">
                <XCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
