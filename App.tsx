
import React, { useState, useEffect } from 'react';
import { Upload, FileText, Database, BarChart2, Table, Download, RefreshCw, Wand2, Loader2, Menu, Image as ImageIcon, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Save, Key, ShieldCheck } from 'lucide-react';
import { DataItem, ProcessingOptions, ColumnMapping } from './types';
import { parseAndProcessData, generateExampleData, getDiagnosticInfo, saveApiKey, getLocalApiKey } from './services/geminiService';
import { SalesTrendChart, CategoryPieChart, RegionBarChart, SalesDistributionChart } from './components/Charts';
import { Toggle, GlassCard } from './components/Controls';

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
  const [colMapping, setColMapping] = useState<ColumnMapping>({ xKey: '', yKey: '', categoryKey: '' });
  
  // Diagnostic State
  const [authMode, setAuthMode] = useState<'server' | 'local'>('server');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [manualKey, setManualKey] = useState('');

  // Initial check
  useEffect(() => {
    const local = getLocalApiKey();
    if (local) {
      setAuthMode('local');
    }
    // handleLoadExample(); // Removed to prevent auto-loading
  }, []);

  const detectColumns = (data: DataItem[]) => {
    if (!data || data.length === 0) return;
    
    const sample = data[0];
    const keys = Object.keys(sample);
    
    let bestDate = '';
    let bestNum = '';
    let bestCat = '';
    
    keys.forEach(key => {
      const val = sample[key];
      const lowerKey = key.toLowerCase();
      
      // Heuristics for Date
      if (!bestDate && (lowerKey.includes('date') || lowerKey.includes('time') || lowerKey.includes('day'))) {
        bestDate = key;
      }
      
      // Heuristics for Category (String)
      if (typeof val === 'string' && !lowerKey.includes('date') && !lowerKey.includes('id') && val.length < 20) {
        if (!bestCat || lowerKey.includes('cat') || lowerKey.includes('region') || lowerKey.includes('type')) {
          bestCat = key;
        }
      }
      
      // Heuristics for Number
      if (typeof val === 'number') {
        if (!bestNum || lowerKey.includes('sale') || lowerKey.includes('rev') || lowerKey.includes('amount')) {
          bestNum = key;
        }
      }
    });

    // Fallbacks
    if (!bestDate) bestDate = keys.find(k => typeof sample[k] === 'string') || keys[0];
    if (!bestNum) bestNum = keys.find(k => typeof sample[k] === 'number') || keys[1];
    if (!bestCat) bestCat = keys.find(k => typeof sample[k] === 'string' && k !== bestDate) || keys[0];

    setColMapping({ xKey: bestDate, yKey: bestNum, categoryKey: bestCat });
  };

  const handleLoadExample = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setRawData("Loading example dataset...");
    try {
      const data = await generateExampleData();
      if (data.length > 0) {
        setProcessedData(data);
        detectColumns(data);
        setRawData(JSON.stringify(data, null, 2));
      }
    } catch (error: any) {
      console.error("Load error", error);
      setErrorMsg(`Failed to load: ${error.message}`);
      setRawData(`Error: ${error.message}`);
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
      if (result.length > 0) {
        setProcessedData(result);
        detectColumns(result);
        setActiveTab('visualizations');
      } else {
        setErrorMsg("AI returned no valid data.");
      }
    } catch (error: any) {
       setErrorMsg(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveKey = () => {
    if (!manualKey.trim()) return;
    saveApiKey(manualKey.trim());
    setAuthMode('local');
    setManualKey('');
    window.location.reload();
  };

  const handleExportData = (format: 'json' | 'csv') => {
    if (processedData.length === 0) return;
    let content = '';
    let extension = '';
    if (format === 'json') {
      content = JSON.stringify(processedData, null, 2);
      extension = 'json';
    } else {
      const headers = Object.keys(processedData[0]).join(',');
      const rows = processedData.map(row => Object.values(row).join(',')).join('\n');
      content = `${headers}\n${rows}`;
      extension = 'csv';
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `datascope_export.${extension}`;
    link.click();
  };

  const handleExportCharts = async () => {
    const element = document.getElementById('visualizations-container');
    const h2c = window.html2canvas;
    if (element && h2c) {
      const canvas = await h2c(element, { backgroundColor: '#0f172a', scale: 2 });
      const link = document.createElement('a');
      link.download = 'dashboard.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Alert/Status Banner */}
      <div className={`border-b ${errorMsg ? 'bg-red-900/20 border-red-500/40' : 'bg-slate-900/50 border-slate-800'}`}>
        <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-3">
             {errorMsg ? (
               <span className="flex items-center gap-2 text-red-300 font-medium"><AlertTriangle className="w-4 h-4" /> {errorMsg}</span>
             ) : (
               <span className="flex items-center gap-2 text-slate-400">
                 {authMode === 'local' ? (
                   <span className="text-emerald-400 flex items-center gap-1"><Key className="w-3 h-3"/> Expert Mode: Using Local Key</span>
                 ) : (
                   <span className="text-blue-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Safe Mode: Using Backend Proxy (Key Hidden)</span>
                 )}
               </span>
             )}
          </div>
          
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setShowDebug(!showDebug)}
                className="text-slate-500 hover:text-slate-300 underline decoration-slate-700"
              >
                {showDebug ? 'Hide Settings' : 'API Settings'}
            </button>
          </div>
        </div>
      </div>

      {showDebug && (
        <div className="bg-slate-900 border-b border-slate-700 p-4">
           <div className="max-w-2xl mx-auto flex flex-col gap-3">
             <h4 className="text-sm font-semibold text-white">API Key Configuration</h4>
             <p className="text-xs text-slate-400">
               If you own this site, enter your key below to run locally. If you are a visitor, you don't need to do anything—the server handles it.
             </p>
             <div className="flex gap-2">
               <input
                  type="password"
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  placeholder="Enter custom API Key (AIza...)"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded text-sm focus:border-blue-500 outline-none"
                />
                <button onClick={handleSaveKey} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Local Key
                </button>
             </div>
             {authMode === 'local' && (
                <button 
                  onClick={() => { localStorage.removeItem('gemini_api_key_enc'); window.location.reload(); }}
                  className="text-xs text-red-400 hover:text-red-300 self-start"
                >
                  Remove Local Key (Revert to Server Mode)
                </button>
             )}
           </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              DataScope Analyzer
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {processedData.length > 0 && (
              <div className="hidden md:flex text-xs gap-2 text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
                 <span>X: <strong className="text-slate-300">{colMapping.xKey}</strong></span>
                 <span className="w-px bg-slate-700 h-3 self-center"></span>
                 <span>Y: <strong className="text-slate-300">{colMapping.yKey}</strong></span>
                 <span className="w-px bg-slate-700 h-3 self-center"></span>
                 <span>Group: <strong className="text-slate-300">{colMapping.categoryKey}</strong></span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel */}
        <div className="lg:col-span-3 space-y-6">
          <GlassCard className="h-full flex flex-col border-t border-t-slate-600/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> Input
              </h2>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div className="relative group flex-1">
                <textarea 
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  placeholder="Paste data here..."
                  className="w-full h-64 lg:h-full bg-slate-950/50 border border-slate-700/80 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 resize-none"
                />
                <button 
                  onClick={() => setRawData('')}
                  className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400 bg-slate-900/80 rounded"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-200 border border-slate-700"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="w-4 h-4" /> Upload
                </button>
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
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
                  className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-sm border border-blue-500/20"
                >
                  <Wand2 className="w-4 h-4" /> Example
                </button>
              </div>

              <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/50 mt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Processing Options</h3>
                <div className="space-y-1">
                  <Toggle label="Clean Missing" checked={options.cleanMissingValues} onChange={(v) => setOptions({...options, cleanMissingValues: v})} />
                  <Toggle label="Normalize" checked={options.normalizeData} onChange={(v) => setOptions({...options, normalizeData: v})} />
                  <Toggle label="Sort (Time)" checked={options.sortData} onChange={(v) => setOptions({...options, sortData: v})} />
                </div>
              </div>

              <button 
                onClick={handleProcessData}
                disabled={isProcessing}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run Analysis'}
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
              <button onClick={() => setActiveTab('table')} className={`px-5 py-2 rounded-lg text-sm font-medium ${activeTab === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Table</button>
              <button onClick={() => setActiveTab('visualizations')} className={`px-5 py-2 rounded-lg text-sm font-medium ${activeTab === 'visualizations' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Visualizations</button>
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => handleExportData('csv')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:text-white">
                <Download className="w-4 h-4" /> Data
              </button>
              <button onClick={handleExportCharts} className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:text-white">
                 <ImageIcon className="w-4 h-4" /> Chart Img
              </button>
            </div>
          </div>

          {activeTab === 'visualizations' ? (
            <div id="visualizations-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
              <GlassCard className="md:col-span-2 min-h-[320px] flex flex-col">
                <h3 className="text-white font-semibold mb-6 flex justify-between">
                   <span>Trend Analysis</span>
                   <span className="text-xs font-normal text-slate-500">{colMapping.xKey ? `${colMapping.xKey} vs ${colMapping.yKey}` : 'No Data'}</span>
                </h3>
                <div className="flex-1 w-full"><SalesTrendChart data={processedData} xKey={colMapping.xKey} yKey={colMapping.yKey} categoryKey={colMapping.categoryKey}/></div>
              </GlassCard>

              <GlassCard className="min-h-[320px] flex flex-col">
                 <h3 className="text-white font-semibold mb-6">Distribution</h3>
                 <div className="flex-1 w-full"><CategoryPieChart data={processedData} xKey={colMapping.xKey} yKey={colMapping.yKey} categoryKey={colMapping.categoryKey} /></div>
              </GlassCard>

              <GlassCard className="md:col-span-2 lg:col-span-1 min-h-[320px] flex flex-col">
                <h3 className="text-white font-semibold mb-6">By Category</h3>
                <div className="flex-1 w-full"><RegionBarChart data={processedData} xKey={colMapping.xKey} yKey={colMapping.yKey} categoryKey={colMapping.categoryKey} /></div>
              </GlassCard>

              <GlassCard className="md:col-span-2 min-h-[320px] flex flex-col">
                <h3 className="text-white font-semibold mb-6">Volume Overview</h3>
                <div className="flex-1 w-full"><SalesDistributionChart data={processedData} xKey={colMapping.xKey} yKey={colMapping.yKey} categoryKey={colMapping.categoryKey} /></div>
              </GlassCard>
            </div>
          ) : (
            <GlassCard className="overflow-hidden h-[600px] flex flex-col">
               <div className="overflow-auto flex-1">
                {processedData.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-900 text-slate-400 text-xs uppercase z-10">
                      <tr>{Object.keys(processedData[0]).map(k => <th key={k} className="p-4 border-b border-slate-700">{k}</th>)}</tr>
                    </thead>
                    <tbody className="text-slate-300 text-sm divide-y divide-slate-800">
                      {processedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-700/30">
                          {Object.values(row).map((val, i) => <td key={i} className="p-4 whitespace-nowrap">{val}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    No data to display. Paste data or upload a file to begin.
                  </div>
                )}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
