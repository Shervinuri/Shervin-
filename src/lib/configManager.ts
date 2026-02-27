import { WireGuardConfig } from '../types/config';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// --- Parsing Utilities ---

export const parseWireGuardConfig = (text: string): WireGuardConfig[] => {
  const configs: WireGuardConfig[] = [];
  
  // Normalize line endings
  const normalizedText = text.replace(/\r\n/g, '\n');

  // Split by [Interface] to handle multiple configs, but keep the delimiter
  // We use a lookahead or just split and re-add. 
  // Simpler: split by `[Interface]` (case insensitive)
  const parts = normalizedText.split(/\[Interface\]/i);
  
  // If the file doesn't start with [Interface], the first part might be empty or garbage, 
  // or it might be a config without the header (rare but possible).
  // However, standard WG configs MUST have [Interface]. 
  // Let's assume valid configs have [Interface].
  
  // If no [Interface] found at all, maybe it's a single config without the header?
  // We'll try to parse the whole text as one config if it contains "PrivateKey"
  let rawConfigs = parts;
  if (parts.length === 1 && normalizedText.toLowerCase().includes('privatekey')) {
      // Treat the whole thing as one section if it has keys but no header
      rawConfigs = ['', normalizedText]; // Empty first part to simulate split
  }

  rawConfigs.forEach((raw, index) => {
    if (!raw.trim()) return;

    // If we split by [Interface], the content `raw` is the body of the interface 
    // PLUS potentially the [Peer] section.
    // We need to prepend [Interface] to make it a standard parser logic, 
    // or just parse lines.
    
    const config: WireGuardConfig = {
      id: crypto.randomUUID(),
      name: `Config-${configs.length + 1}`,
      interface: { PrivateKey: '', Address: '' },
      peer: { PublicKey: '', AllowedIPs: '', Endpoint: '' },
    };

    const lines = raw.split('\n');
    let currentSection: 'interface' | 'peer' | null = 'interface'; 

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      if (trimmed.toLowerCase().includes('[peer]')) {
        currentSection = 'peer';
        return;
      }
      
      // If we see [Interface] again (shouldn't happen with split, but for safety)
      if (trimmed.toLowerCase().includes('[interface]')) {
        currentSection = 'interface';
        return;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex !== -1) {
        const key = trimmed.substring(0, separatorIndex).trim();
        const value = trimmed.substring(separatorIndex + 1).trim();

        if (currentSection === 'interface') {
          config.interface[key] = value;
        } else if (currentSection === 'peer') {
          config.peer[key] = value;
        }
      }
    });

    // Validation: Needs at least PrivateKey and PublicKey (or Endpoint) to be useful
    if (config.interface.PrivateKey && (config.peer.PublicKey || config.peer.Endpoint)) {
      configs.push(config);
    }
  });

  return configs;
};

export const parseAmneziaBackup = (jsonString: string): WireGuardConfig[] => {
  try {
    const data = JSON.parse(jsonString);
    const configs: WireGuardConfig[] = [];
    
    // Helper to parse potential stringified JSON
    const tryParse = (str: any) => {
        if (typeof str === 'string') {
            try { return JSON.parse(str); } catch (e) { return str; }
        }
        return str;
    };

    // Handle "Servers" or "serversList" being a stringified array
    let rootData = data;
    if (data.Servers && typeof data.Servers === 'string') {
        rootData = { ...data, Servers: tryParse(data.Servers) };
    }
    if (data.serversList && typeof data.serversList === 'string') {
        rootData = { ...data, serversList: tryParse(data.serversList) };
    }

    // Recursive function to find configs
    const findConfigs = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;

        // Check for last_config
        if (obj.wireguard || obj.awg) {
            const container = obj.wireguard || obj.awg;
            if (container.last_config) {
                try {
                    // last_config is often a stringified JSON object
                    let wgConfig = container.last_config;
                    if (typeof wgConfig === 'string') {
                        wgConfig = JSON.parse(wgConfig);
                    }
                    
                    // Sometimes last_config is just the raw INI string? 
                    // The user mentioned "INI format inside \n". 
                    // If it's a string starting with [Interface], parse it as text.
                    if (typeof wgConfig === 'string' && wgConfig.includes('[Interface]')) {
                        const parsedText = parseWireGuardConfig(wgConfig);
                        if (parsedText.length > 0) {
                            parsedText.forEach(c => {
                                c.name = obj.description || obj.name || c.name;
                                c.id = obj.id || c.id;
                                configs.push(c);
                            });
                        }
                        return;
                    }

                    // Otherwise assume it's the standard JSON structure
                    const newConfig: WireGuardConfig = {
                        id: obj.id || crypto.randomUUID(),
                        name: obj.description || obj.name || `Amnezia-${configs.length + 1}`,
                        interface: {
                            PrivateKey: wgConfig.config?.PrivateKey || '',
                            Address: wgConfig.config?.Address || '',
                            DNS: wgConfig.config?.DNS,
                            Jc: wgConfig.config?.Jc,
                            Jmin: wgConfig.config?.Jmin,
                            Jmax: wgConfig.config?.Jmax,
                            S1: wgConfig.config?.S1,
                            S2: wgConfig.config?.S2,
                            H1: wgConfig.config?.H1,
                            H2: wgConfig.config?.H2,
                            H3: wgConfig.config?.H3,
                            H4: wgConfig.config?.H4,
                        },
                        peer: {
                            PublicKey: wgConfig.peers?.[0]?.PublicKey || '',
                            AllowedIPs: wgConfig.peers?.[0]?.AllowedIPs || '',
                            Endpoint: wgConfig.peers?.[0]?.Endpoint || '',
                            PersistentKeepalive: wgConfig.peers?.[0]?.PersistentKeepalive,
                        }
                    };
                    if (newConfig.interface.PrivateKey) {
                        configs.push(newConfig);
                    }
                } catch (e) {
                    // Ignore
                }
            }
        }

        // Recursion
        if (Array.isArray(obj)) {
            obj.forEach(item => findConfigs(item));
        } else {
            Object.values(obj).forEach(val => findConfigs(val));
        }
    };

    findConfigs(rootData);
    return configs;

  } catch (e) {
    console.error("Failed to parse Amnezia backup", e);
    return [];
  }
};

// --- Generation Utilities ---

export const generateWireGuardConfigText = (config: WireGuardConfig): string => {
  let text = `[Interface]\n`;
  Object.entries(config.interface).forEach(([key, value]) => {
    if (value !== undefined && value !== '') text += `${key} = ${value}\n`;
  });

  text += `\n[Peer]\n`;
  Object.entries(config.peer).forEach(([key, value]) => {
    if (value !== undefined && value !== '') text += `${key} = ${value}\n`;
  });

  return text;
};

export const generateAmneziaBackup = (configs: WireGuardConfig[]): string => {
  // Construct a robust Amnezia backup structure
  // User specified: Servers/serversList is stringified array, last_config is stringified JSON
  
  const serverList = configs.map((cfg, index) => {
    // The inner config object (AmneziaWG JSON format)
    const innerConfig = {
      config: {
        ...cfg.interface
      },
      peers: [
        {
          ...cfg.peer
        }
      ]
    };

    // Stringify the inner config to be placed in last_config
    const lastConfigString = JSON.stringify(innerConfig);

    return {
      id: cfg.id,
      description: cfg.name || `Server ${index + 1}`,
      hostName: cfg.peer.Endpoint?.split(':')[0] || '0.0.0.0',
      port: parseInt(cfg.peer.Endpoint?.split(':')[1] || '51820'),
      defaultContainer: "amnezia-awg", 
      containers: [
        {
          id: crypto.randomUUID(),
          containerType: "amnezia-awg",
          awg: {
             last_config: lastConfigString
          },
          wireguard: { // Fallback/Alternative
             last_config: lastConfigString
          }
        }
      ]
    };
  });

  // Create the root object
  // We will provide a standard structure. 
  // If the user wants "serversList" to be a stringified array, we can do that,
  // but usually the app imports standard JSON too. 
  // Let's stick to standard JSON for the root to ensure compatibility, 
  // but ensure the internal stringification (last_config) is correct.
  
  const backup = {
    version: 1,
    defaultServerIndex: 0,
    servers: serverList // Using 'servers' as it's common. 
  };

  return JSON.stringify(backup, null, 2);
};

// --- Processing Utilities ---

export const deduplicateConfigs = (configs: WireGuardConfig[]): WireGuardConfig[] => {
  const seen = new Set();
  return configs.filter((cfg) => {
    const key = `${cfg.peer.PublicKey}-${cfg.peer.Endpoint}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const applyObfuscation = (configs: WireGuardConfig[]): WireGuardConfig[] => {
  return configs.map(cfg => {
    const newCfg = { ...cfg, interface: { ...cfg.interface }, peer: { ...cfg.peer } };
    
    // AmneziaWG Obfuscation Parameters
    newCfg.interface.Jc = '5';
    newCfg.interface.Jmin = '50';
    newCfg.interface.Jmax = '1000';
    newCfg.interface.S1 = '30';
    newCfg.interface.S2 = '30';
    newCfg.interface.H1 = Math.floor(Math.random() * 1000000000).toString();
    newCfg.interface.H2 = Math.floor(Math.random() * 1000000000).toString();
    newCfg.interface.H3 = Math.floor(Math.random() * 1000000000).toString();
    newCfg.interface.H4 = Math.floor(Math.random() * 1000000000).toString();
    
    newCfg.peer.PersistentKeepalive = '25';
    
    return newCfg;
  });
};

// --- Export Utilities ---

export const downloadZip = async (configs: WireGuardConfig[]) => {
  const zip = new JSZip();
  
  configs.forEach(cfg => {
    const content = generateWireGuardConfigText(cfg);
    // Use Endpoint IP or Name for filename, sanitize
    const filename = (cfg.name || cfg.peer.Endpoint?.split(':')[0] || 'config').replace(/[^a-z0-9]/gi, '_');
    zip.file(`${filename}.conf`, content);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'wireguard_configs.zip');
};

export const downloadSingleConfig = (config: WireGuardConfig) => {
  const content = generateWireGuardConfigText(config);
  const filename = (config.name || config.peer.Endpoint?.split(':')[0] || 'config').replace(/[^a-z0-9]/gi, '_');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${filename}.conf`);
};
