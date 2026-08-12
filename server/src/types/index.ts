export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  database: {
    connected: boolean;
    status: string;
  };
  uptime: number;
}
