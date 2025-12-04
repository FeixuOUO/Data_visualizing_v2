import React, { useState, useEffect } from 'react';
import { Upload, FileText, Database, BarChart2, Table, Download, RefreshCw, Wand2, Loader2, Menu, Image as ImageIcon, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { DataItem, ProcessingOptions } from './types';
import { parseAndProcessData, generateExampleData, getApiKey, getDiagnosticInfo } from './services/geminiService';
import { SalesTrendChart, CategoryPieChart, RegionBarChart, SalesDistributionChart } from './components/Charts';
import { Toggle, GlassCard } from './components/Controls';

// Declare html2canvas on window since we are loading it via CDN in index.html for stability
declare global {
  interface Window {
    html2canvas: any;
  }
}

const App: React.FC = () => {
  // State
  const [rawData, setRawData] = useState<string>('');
  const [processedData, setProcessedData] = useState<DataItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'table' | 'visualizations'>('visualizations');
  const [options, setOptions] = useState<ProcessingOptions>({
    cleanMissingValues: true,
    normalizeData: false,
    sortData: true,
    filterRows: true
  });
  
  // Diagnostic State
  const [keyStatus, setKeyStatus] = useState<'checking' | 'found' | 'missing'>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Check key on mount
  useEffect(() => {
    const key = getApiKey();
    setKeyStatus(key ? 'found' : 'missing');
    setDebugInfo(getDiagnosticInfo());
  }, []);

  // Load example data on mount
  useEffect(() => {
    handleLoadExample();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadExample = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setRawData("Loading example dataset...");
    try {
      const data = await generateExampleData();
      if (data.length > 0) {
        setProcessedData(data);
        setRawData(JSON.stringify(data, null, 2));
      } else {
        setRawData("No data generated. Check console for details.");
      }
    } catch (error: any) {
      console.error("Error loading example", error);
      if (error.message === "MISSING_KEY") {
        setKeyStatus('missing');
        setErrorMsg("API Key not found. Please set VITE_API_KEY in Vercel.");
        setRawData("Error: API Key is missing. Check the banner above.");
      } else {
        setErrorMsg(`API Error: ${error.message || "Unknown error"}`);
        setRawData(`Error loading data: ${error.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessData = async () => {
    if (!rawData.trim()) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const result = await parseAndProcessData(rawData, options);
      setProcessedData(result);
      setActiveTab('visualizations');
    } catch (error: any) {
       if (error.message === "MISSING_KEY") {
        setKeyStatus('missing');
        setErrorMsg("API Key missing. Cannot process data.");
      } else {
        setErrorMsg("Failed to process data. Check console for details.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportData = (format: 'json' | 'csv') => {
    if (processedData.length === 0) return;

    let content = '';
    let mimeType = '';
    let extension = '';

    if (format === 'json') {
      content = JSON.stringify(processedData, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      // Convert to CSV
      const headers = Object.keys(processedData[0]).join(',');
      const rows = processedData.map(row => Object.values(row).join(',')).join('\n');
      content = `${headers}\n${rows}`;
      mimeType = 'text/csv';
      extension = 'csv';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `datascope_export.${extension}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportCharts = async () => {
    const element = document.getElementById('visualizations-container');
    
    // Check if html2canvas is available (from CDN or npm)
    const h2c = window.html2canvas;

    if (element && h2c) {
      try {
        const canvas = await h2c(element, { 
          backgroundColor: '#0f172a',
          scale: 2, // Higher quality
          logging: false,
          useCORS: true
        });
        const link = document.createElement('a');
        link.download = 'datascope_dashboard.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error("Export failed", err);
        alert("Failed to export charts. Please try again.");
      }
    } else if (!h2c) {
      alert("Export functionality is initializing, please try again in a moment.");
    } else {
       alert("Switch to Visualizations tab to export charts.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Diagnostic Banner */}
      {keyStatus === 'missing' && (
        <div className="bg-red-500/10 border-b border-red-500/50">
          <div className="px-4 py-3 flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-200 text-sm font-medium">
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>System Alert: VITE_API_KEY not detected. Please check Vercel settings.</span>
            </div>
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs flex items-center gap-1 text-red-300 hover:text-white underline decoration-red-400/50"
            >
              {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
              {showDebug ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
            </button>
          </div>
          {showDebug && (
            <div className="bg-black/30 px-4 py-3 text-xs font-mono text-slate-400 border-t border-red-500/20 max-h-40 overflow-auto">
              {debugInfo.map((line, i) => (
                <div key={i} className="mb-1">{line}</div>
              ))}
              <div className="mt-2 text-slate-500">Tip: Environment variables must start with VITE_ to be exposed to the browser.</div>
            </div>
          )}
        </div>
      )}
      
      {keyStatus === 'found' && errorMsg && (
        <div className="bg-amber-500/10 border-b border-amber-500/50 px-4 py-2 flex items-center justify-center gap-2 text-amber-200 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navbar */}
      <nav className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                DataScope Analyzer
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {/* Status Pill */}
             <div className={`hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border ${
               keyStatus === 'found' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
             }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${keyStatus === 'found' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></span>
                {keyStatus === 'found' ? 'AI System Ready' : 'System Offline'}
             </div>
             <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400 font-medium bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
               Data Visualizer & Analyzer
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Controls */}
        <div className="lg:col-span-3 space-y-6">
          <GlassCard className="h-full flex flex-col border-t border-t-slate-600/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Data Input & Controls
              </h2>
              <Menu className="w-5 h-5 text-slate-500 cursor-pointer hover:text-white" />
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div className="relative group flex-1">
                <textarea 
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  placeholder="Paste CSV, JSON, or unstructured text data here..."
                  className="w-full h-64 lg:h-full bg-slate-950/50 border border-slate-700/80 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 resize-none scrollbar-thin scrollbar-thumb-slate-700 transition-all focus:ring-1 focus:ring-blue-500/50"
                />
                <button 
                  onClick={() => setRawData('')}
                  className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 rounded"
                  title="Clear"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors text-slate-200 border border-slate-700"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".csv,.json,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setRawData(ev.target?.result as string);
                      reader.readAsText(file);
                    }
                  }} 
                />
                
                <button 
                  onClick={handleLoadExample}
                  className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-sm transition-colors border border-blue-500/20"
                >
                  <Wand2 className="w-4 h-4" />
                  Load Example
                </button>
              </div>

              <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/50 mt-4 shadow-inner">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  Processing Functions
                  <div className="h-px bg-slate-700 flex-1 ml-2 opacity-50"></div>
                </h3>
                
                <div className="space-y-1">
                  <Toggle 
                    label="Clean Missing Values" 
                    checked={options.cleanMissingValues} 
                    onChange={(v) => setOptions({...options, cleanMissingValues: v})} 
                  />
                  <Toggle 
                    label="Normalize Data" 
                    checked={options.normalizeData} 
                    onChange={(v) => setOptions({...options, normalizeData: v})} 
                  />
                  <Toggle 
                    label="Sort By Column" 
                    checked={options.sortData} 
                    onChange={(v) => setOptions({...options, sortData: v})} 
                  />
                  <Toggle 
                    label="Filter Rows" 
                    checked={options.filterRows} 
                    onChange={(v) => setOptions({...options, filterRows: v})} 
                  />
                </div>
              </div>

              <button 
                onClick={handleProcessData}
                disabled={isProcessing || keyStatus === 'missing'}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Run Analysis</>
                )}
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Right Panel: Content */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 backdrop-blur-sm w-fit">
              <button
                onClick={() => setActiveTab('table')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'table' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="w-4 h-4" />
                Data Table
              </button>
              <button
                onClick={() => setActiveTab('visualizations')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'visualizations' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                Visualizations
              </button>
            </div>
            
            <div className="flex gap-2">
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition-colors shadow-sm">
                  <Download className="w-4 h-4" /> Export Data
                </button>
                <div className="absolute right-0 top-full mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden hidden group-hover:block z-20">
                  <button onClick={() => handleExportData('csv')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">CSV</button>
                  <button onClick={() => handleExportData('json')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">JSON</button>
                </div>
              </div>
              
              <button 
                onClick={handleExportCharts} 
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition-colors shadow-sm"
              >
                 <ImageIcon className="w-4 h-4" /> Export Charts
              </button>
            </div>
          </div>

          {activeTab === 'visualizations' ? (
            <div id="visualizations-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-auto min-h-[600px] p-1">
              {/* Sales Trend - Large Top Left */}
              <GlassCard className="md:col-span-2 min-h-[320px] flex flex-col">
                <h3 className="text-white font-semibold mb-6 text-lg tracking-tight">Sales Trend</h3>
                <div className="flex-1 w-full min-h-0">
                  <SalesTrendChart data={processedData} />
                </div>
              </GlassCard>

              {/* Product Breakdown - Top Right */}
              <GlassCard className="min-h-[320px] flex flex-col">
                 <h3 className="text-white font-semibold mb-6 text-lg tracking-tight">Product Category Breakdown</h3>
                 <div className="flex-1 w-full min-h-0">
                  <CategoryPieChart data={processedData} />
                 </div>
              </GlassCard>

              {/* Regional Sales - Bottom Left */}
              <GlassCard className="md:col-span-2 lg:col-span-1 min-h-[320px] flex flex-col">
                <h3 className="text-white font-semibold mb-6 text-lg tracking-tight">Units Sold by Region</h3>
                <div className="flex-1 w-full min-h-0">
                  <RegionBarChart data={processedData} />
                </div>
              </GlassCard>

              {/* Distribution - Bottom Right */}
              <GlassCard className="md:col-span-2 min-h-[320px] flex flex-col">
                <h3 className="text-white font-semibold mb-6 text-lg tracking-tight">Sales Distribution</h3>
                <div className="flex-1 w-full min-h-0">
                  <SalesDistributionChart data={processedData} />
                </div>
              </GlassCard>
            </div>
          ) : (
            <GlassCard className="overflow-hidden h-[calc(100vh-250px)] min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">Raw Data Table</h3>
                <span className="text-xs text-slate-500 bg-slate-900/50 px-2 py-1 rounded border border-slate-800">
                  {processedData.length} records found
                </span>
              </div>
              <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/20 border border-slate-700/50 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-900 text-slate-400 text-xs uppercase tracking-wider z-10">
                    <tr>
                      {processedData.length > 0 && Object.keys(processedData[0]).map((key) => (
                        <th key={key} className="p-4 border-b border-slate-700 font-semibold">{key.replace('_', ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 text-sm divide-y divide-slate-800">
                    {processedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-700/30 transition-colors odd:bg-slate-800/20">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="p-4 whitespace-nowrap">{val}</td>
                        ))}
                      </tr>
                    ))}
                    {processedData.length === 0 && (
                      <tr>
                        <td className="p-12 text-center text-slate-500 italic" colSpan={5}>
                          No data available. <br/>Upload a file or use "Load Example" to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;