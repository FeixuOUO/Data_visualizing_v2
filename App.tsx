import React, { useState, useEffect } from 'react';
import { Upload, FileText, Database, BarChart2, Table, Download, RefreshCw, Wand2, Loader2, Menu } from 'lucide-react';
import { DataItem, ProcessingOptions } from './types';
import { parseAndProcessData, generateExampleData } from './services/geminiService';
import { SalesTrendChart, CategoryPieChart, RegionBarChart, SalesDistributionChart } from './components/Charts';
import { Toggle, GlassCard } from './components/Controls';

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
    filterRows: false
  });

  // Load example data on mount
  useEffect(() => {
    handleLoadExample();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadExample = async () => {
    setIsProcessing(true);
    setRawData("Loading example dataset...");
    try {
      const data = await generateExampleData();
      setProcessedData(data);
      setRawData(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error loading example", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessData = async () => {
    if (!rawData.trim()) return;
    setIsProcessing(true);
    try {
      const result = await parseAndProcessData(rawData, options);
      setProcessedData(result);
      setActiveTab('visualizations');
    } catch (error) {
      alert("Failed to process data. Please ensure you have a valid API Key set.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = (type: 'data' | 'charts') => {
    if (type === 'data') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(processedData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "datascope_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } else {
      alert("Chart export requires html2canvas or similar (not included in this simplified demo).");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Navbar */}
      <nav className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-2 rounded-lg">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                DataScope Analyzer
              </h1>
            </div>
          </div>
          <div className="text-sm text-slate-400 font-medium hidden sm:block">
            Data Visualizer & Analyzer
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Controls */}
        <div className="lg:col-span-3 space-y-6">
          <GlassCard className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Data Input
              </h2>
              <Menu className="w-5 h-5 text-slate-500 cursor-pointer hover:text-white" />
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div className="relative group flex-1">
                <textarea 
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  placeholder="Paste CSV, JSON, or messy text here..."
                  className="w-full h-64 lg:h-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 resize-none scrollbar-thin scrollbar-thumb-slate-700"
                />
                <button 
                  onClick={() => setRawData('')}
                  className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Clear"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors text-slate-200"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Upload
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
                  className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-sm transition-colors border border-blue-600/20"
                >
                  <Wand2 className="w-4 h-4" />
                  Example
                </button>
              </div>

              <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/50 mt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  Processing Functions
                  <div className="h-px bg-slate-700 flex-1 ml-2"></div>
                </h3>
                
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
                  label="Sort by Date" 
                  checked={options.sortData} 
                  onChange={(v) => setOptions({...options, sortData: v})} 
                />
                <Toggle 
                  label="Smart Filter Rows" 
                  checked={options.filterRows} 
                  onChange={(v) => setOptions({...options, filterRows: v})} 
                />
              </div>

              <button 
                onClick={handleProcessData}
                disabled={isProcessing}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Process Data</>
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'table' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="w-4 h-4" />
                Data Table
              </button>
              <button
                onClick={() => setActiveTab('visualizations')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'visualizations' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                Visualizations
              </button>
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => handleExport('data')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                <Download className="w-4 h-4" /> Export Data
              </button>
              <button onClick={() => handleExport('charts')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                 Export Charts
              </button>
            </div>
          </div>

          {activeTab === 'visualizations' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[calc(100%-80px)]">
              {/* Sales Trend - Large Top Left */}
              <GlassCard className="md:col-span-2 min-h-[300px] flex flex-col">
                <h3 className="text-white font-semibold mb-4 text-lg">Sales Trend</h3>
                <div className="flex-1 w-full min-h-0">
                  <SalesTrendChart data={processedData} />
                </div>
              </GlassCard>

              {/* Product Breakdown - Top Right */}
              <GlassCard className="min-h-[300px] flex flex-col">
                 <h3 className="text-white font-semibold mb-4 text-lg">Product Category Breakdown</h3>
                 <div className="flex-1 w-full min-h-0">
                  <CategoryPieChart data={processedData} />
                 </div>
              </GlassCard>

              {/* Regional Sales - Bottom Left */}
              <GlassCard className="md:col-span-2 lg:col-span-1 min-h-[300px] flex flex-col">
                <h3 className="text-white font-semibold mb-4 text-lg">Units Sold by Region</h3>
                <div className="flex-1 w-full min-h-0">
                  <RegionBarChart data={processedData} />
                </div>
              </GlassCard>

              {/* Distribution - Bottom Right */}
              <GlassCard className="md:col-span-2 min-h-[300px] flex flex-col">
                <h3 className="text-white font-semibold mb-4 text-lg">Sales Distribution</h3>
                <div className="flex-1 w-full min-h-0">
                  <SalesDistributionChart data={processedData} />
                </div>
              </GlassCard>
            </div>
          ) : (
            <GlassCard className="overflow-hidden h-full min-h-[600px] flex flex-col">
              <h3 className="text-white font-semibold mb-4 text-lg">Raw Data Table</h3>
              <div className="overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/20">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-900/95 text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      {processedData.length > 0 && Object.keys(processedData[0]).map((key) => (
                        <th key={key} className="p-4 border-b border-slate-700 font-semibold">{key.replace('_', ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 text-sm divide-y divide-slate-700/50">
                    {processedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="p-4 whitespace-nowrap">{val}</td>
                        ))}
                      </tr>
                    ))}
                    {processedData.length === 0 && (
                      <tr>
                        <td className="p-8 text-center text-slate-500" colSpan={5}>No data available. Import or generate data to view.</td>
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
