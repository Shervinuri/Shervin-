export interface WireGuardConfig {
  id: string;
  name: string;
  interface: {
    PrivateKey: string;
    Address: string;
    DNS?: string;
    Jc?: string;
    Jmin?: string;
    Jmax?: string;
    S1?: string;
    S2?: string;
    H1?: string;
    H2?: string;
    H3?: string;
    H4?: string;
    [key: string]: string | undefined;
  };
  peer: {
    PublicKey: string;
    AllowedIPs: string;
    Endpoint: string;
    PersistentKeepalive?: string;
    [key: string]: string | undefined;
  };
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
