import React, { useState, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { GlassInput } from './GlassInput';
import { WireGuardConfig, LogEntry } from '../types/config';
import { 
  parseWireGuardConfig, 
  parseAmneziaBackup, 
  generateWireGuardConfigText, 
  generateAmneziaBackup,
  deduplicateConfigs,
  applyObfuscation,
  downloadZip,
  downloadSingleConfig
} from '../lib/configManager';
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  RefreshCw, 
  Shield, 
  Copy, 
  Terminal,
  Save,
  FileJson,
  Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';

export const ConfigManager = () => {
  const [configs, setConfigs] = useState<WireGuardConfig[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{ id: crypto.randomUUID(), timestamp: new Date(), message, type }, ...prev]);
  };

  const [lastImportFormat, setLastImportFormat] = useState<'json' | 'text' | null>(null);

  const handleTextImport = () => {
    if (!inputText.trim()) return;
    try {
      // Try parsing as JSON first (Amnezia Backup)
      let newConfigs: WireGuardConfig[] = [];
      if (inputText.trim().startsWith('{') || inputText.trim().startsWith('[')) {
        newConfigs = parseAmneziaBackup(inputText);
        setLastImportFormat('json');
        addLog(`Parsed ${newConfigs.length} configs from JSON text`, 'success');
      } else {
        // Fallback to WireGuard text format
        newConfigs = parseWireGuardConfig(inputText);
        setLastImportFormat('text');
        addLog(`Parsed ${newConfigs.length} configs from WireGuard text`, 'success');
      }
      
      if (newConfigs.length > 0) {
        setConfigs(prev => [...prev, ...newConfigs]);
        setInputText('');
      } else {
        addLog('No valid configs found in text input', 'warning');
      }
    } catch (e) {
      addLog('Error parsing text input', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addLog(`Reading file: ${file.name}...`, 'info');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      
      if (file.name.endsWith('.zip')) {
        try {
            const zip = await JSZip.loadAsync(file);
            let extractedConfigs: WireGuardConfig[] = [];
            let fileCount = 0;
            
            for (const filename of Object.keys(zip.files)) {
                if (!zip.files[filename].dir) {
                    const text = await zip.files[filename].async('string');
                    // Try parsing every file in zip as WireGuard config
                    const parsed = parseWireGuardConfig(text);
                    if (parsed.length > 0) {
                        extractedConfigs = [...extractedConfigs, ...parsed];
                        fileCount++;
                    }
                }
            }
            
            if (extractedConfigs.length > 0) {
                setConfigs(prev => [...prev, ...extractedConfigs]);
                setLastImportFormat('text'); // Zip usually contains text configs
                addLog(`Success: Extracted ${extractedConfigs.length} configs from ${fileCount} files in ZIP`, 'success');
            } else {
                addLog('Warning: No valid configs found in ZIP', 'warning');
            }
        } catch (err) {
            addLog('Error: Failed to process ZIP file', 'error');
            console.error(err);
        }
      } else {
        // Content-based detection strategy
        let newConfigs: WireGuardConfig[] = [];
        let strategy = '';

        // Strategy 1: Try Amnezia/JSON
        if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
            newConfigs = parseAmneziaBackup(content);
            strategy = 'Amnezia/JSON';
            setLastImportFormat('json');
        }

        // Strategy 2: If JSON failed or returned 0, try standard WireGuard
        if (newConfigs.length === 0) {
            // Check if it looks like a config file
            if (content.toLowerCase().includes('[interface]') || content.toLowerCase().includes('privatekey')) {
                newConfigs = parseWireGuardConfig(content);
                strategy = 'WireGuard/Text';
                setLastImportFormat('text');
            }
        }

        if (newConfigs.length > 0) {
            setConfigs(prev => [...prev, ...newConfigs]);
            addLog(`Success: Parsed ${newConfigs.length} configs from ${file.name} (${strategy})`, 'success');
        } else {
            addLog(`Error: Could not parse any configs from ${file.name}. Check format.`, 'error');
        }
      }
    };
    
    if (file.name.endsWith('.zip')) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSmartExport = () => {
      if (lastImportFormat === 'json') {
          handleExportJson();
      } else {
          handleExportText();
      }
  };

  const handleDeduplicate = () => {
    const unique = deduplicateConfigs(configs);
    const removedCount = configs.length - unique.length;
    setConfigs(unique);
    addLog(`Removed ${removedCount} duplicate configs`, 'info');
  };

  const handleObfuscate = () => {
    const obfuscated = applyObfuscation(configs);
    setConfigs(obfuscated);
    addLog('Applied AmneziaWG obfuscation parameters to all configs', 'success');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear all configs?')) {
      setConfigs([]);
      setLogs([]);
      addLog('All data cleared', 'warning');
    }
  };

  const handleDelete = (id: string) => {
    setConfigs(prev => prev.filter(c => c.id !== id));
    addLog('Config deleted', 'info');
  };

  const handleExportJson = () => {
    const json = generateAmneziaBackup(configs);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amnezia_backup.json';
    a.click();
    addLog('Exported as Amnezia Backup JSON', 'success');
  };

  const handleExportText = () => {
    const text = configs.map(generateWireGuardConfigText).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wireguard_bulk.conf';
    a.click();
    addLog('Exported as Bulk Text', 'success');
  };

  return (
    <div className="space-y-8">
      {/* Importer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="text-blue-500" />
            <h3 className="text-lg font-bold">Import Configs</h3>
          </div>
          
          <textarea
            className="w-full h-40 bg-white/30 rounded-xl p-4 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none font-mono text-sm"
            placeholder="Paste WireGuard configs or Amnezia JSON here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          
          <div className="flex gap-3">
            <GlassButton onClick={handleTextImport} className="flex-1">
              Parse Text
            </GlassButton>
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                // Removed restrictive accept to allow user to select any file if needed, 
                // but keeping common extensions as suggestions
                accept=".conf,.config,.txt,.json,.backup,.zip,application/json,text/plain"
              />
              <GlassButton 
                variant="secondary" 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload size={18} /> Upload File
              </GlassButton>
            </div>
          </div>
        </GlassCard>

        {/* Action Center */}
        <GlassCard className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="text-purple-500" />
            <h3 className="text-lg font-bold">Processing Tools</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <GlassButton 
              variant="ghost" 
              onClick={handleDeduplicate}
              className="flex items-center justify-center gap-2 h-12"
            >
              <Copy size={18} /> Deduplicate
            </GlassButton>
            <GlassButton 
              variant="primary" 
              onClick={handleObfuscate}
              className="flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              <Shield size={18} /> Inject Obfuscation
            </GlassButton>
            <GlassButton 
              variant="ghost" 
              onClick={handleReset}
              className="flex items-center justify-center gap-2 h-12 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={18} /> Reset All
            </GlassButton>
            <GlassButton 
              variant="ghost" 
              onClick={() => addLog(`Current count: ${configs.length}`, 'info')}
              className="flex items-center justify-center gap-2 h-12"
            >
              <RefreshCw size={18} /> Refresh Stats
            </GlassButton>
          </div>

          <div className="mt-auto pt-4 border-t border-white/20">
            <p className="text-sm text-slate-500 mb-2 font-semibold">Export Options:</p>
            <div className="flex gap-2">
              <GlassButton 
                onClick={handleSmartExport} 
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                title={`Export as ${lastImportFormat === 'json' ? 'Amnezia Backup' : 'WireGuard Text'}`}
              >
                <Save size={18} className="mr-2" /> 
                Save as {lastImportFormat === 'json' ? 'JSON' : 'Text'}
              </GlassButton>
              <GlassButton variant="icon" onClick={handleExportJson} title="Export JSON">
                <FileJson size={18} />
              </GlassButton>
              <GlassButton variant="icon" onClick={handleExportText} title="Export Text">
                <FileText size={18} />
              </GlassButton>
              <GlassButton variant="icon" onClick={() => downloadZip(configs)} title="Download ZIP">
                <Archive size={18} />
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Logger */}
      <GlassCard className="bg-black/80 text-green-400 font-mono text-xs p-4 h-32 overflow-y-auto border-slate-800">
        <div className="flex items-center gap-2 mb-2 text-slate-400 border-b border-slate-700 pb-1 sticky top-0 bg-black/80">
          <Terminal size={14} /> <span>System Log</span>
        </div>
        <div className="flex flex-col-reverse">
          {logs.length === 0 && <span className="text-slate-600">Ready for input...</span>}
          {logs.map((log) => (
            <div key={log.id} className="mb-1">
              <span className="text-slate-500">[{log.timestamp.toLocaleTimeString()}]</span>{' '}
              <span className={
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'warning' ? 'text-yellow-400' : 
                log.type === 'success' ? 'text-green-400' : 'text-blue-300'
              }>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Config Grid */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-lg text-sm">{configs.length}</span>
          Loaded Configs
        </h3>
        
        {configs.length === 0 ? (
          <div className="text-center py-20 text-slate-400 bg-white/20 rounded-3xl border border-white/30 border-dashed">
            <p>No configs loaded. Import some to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {configs.map((config) => (
                <motion.div
                  key={config.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <GlassCard className="p-4 relative group">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => downloadSingleConfig(config)}
                        className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(config.id)}
                        className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mb-3">
                      <h4 className="font-bold text-slate-800 truncate pr-16">{config.name}</h4>
                      <p className="text-xs text-slate-500 font-mono truncate">{config.peer.Endpoint}</p>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 bg-white/30 p-2 rounded-lg font-mono">
                      <div className="flex justify-between">
                        <span>Pub:</span>
                        <span className="truncate w-24" title={config.peer.PublicKey}>
                          {config.peer.PublicKey.substring(0, 8)}...
                        </span>
                      </div>
                      {config.interface.Jc && (
                        <div className="flex justify-between text-purple-600 font-bold">
                          <span>Obfuscated:</span>
                          <span>Yes (Jc={config.interface.Jc})</span>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper for icon component
import { Settings } from 'lucide-react';
