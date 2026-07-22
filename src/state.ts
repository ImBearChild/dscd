import van from "vanjs-core";

export interface ProxyInfo {
  name: string;
  type: string;
  now?: string;
  all?: string[];
  history?: { time: string; delay: number }[];
  testUrl?: string;
  udp?: boolean;
}

export interface SubscriptionInfo {
  Upload?: number;
  Download?: number;
  Total?: number;
  Expire?: number;
}

export interface ProviderInfo {
  name: string;
  type: string;
  vehicleType: string;
  proxies: ProxyInfo[];
  testUrl: string;
  expectedStatus: string;
  updatedAt?: string;
  subscriptionInfo?: SubscriptionInfo;
}

export interface Connection {
  id: string;
  metadata: {
    network: string;
    type: string;
    sourceIP: string;
    destinationIP: string;
    sourcePort: string;
    destinationPort: string;
    host: string;
    dnsMode: string;
    processPath: string;
  };
  upload: number;
  download: number;
  start: string;
  chains: string[];
  rule: string;
  rulePayload: string;
}

export interface LogEntry {
  type: string;
  payload: string;
}

export interface Traffic {
  up: number;
  down: number;
}

function parseURLParams() {
  const params = new URLSearchParams(location.search);
  return {
    hostname: params.get("hostname") || "",
    port: params.get("port") || "",
    secret: params.get("secret") || "",
  };
}

function buildApiUrl(hostname: string, port: string): string {
  if (hostname && port) return `http://${hostname}:${port}`;
  if (hostname) return `http://${hostname}:9090`;
  return "";
}

export function resolveApiUrl(localStorageKey: string, defaultUrl: string): string {
  const { hostname, port } = parseURLParams();
  const urlFromParams = buildApiUrl(hostname, port);

  if (urlFromParams) return urlFromParams;

  if (port && !hostname) {
    const stored = localStorage.getItem(localStorageKey) || defaultUrl;
    try {
      const u = new URL(stored);
      u.port = port;
      return u.href.replace(/\/$/, "");
    } catch {
      return stored;
    }
  }

  return localStorage.getItem(localStorageKey) || defaultUrl;
}

export function resolveSecret(): string {
  const { secret } = parseURLParams();
  if (secret) return secret;
  return localStorage.getItem("clash-secret") || "";
}

const urlParams = parseURLParams();
const hasURLParams = !!(urlParams.hostname || urlParams.port);

export const apiUrl = van.state(resolveApiUrl("clash-api-url", "http://127.0.0.1:9090"));
export const secret = van.state(resolveSecret());
export const connected = van.state(false);
export const connecting = van.state(false);
export const connectionError = van.state("");

export const proxies = van.state<Record<string, ProxyInfo>>({});
export const providers = van.state<Record<string, ProviderInfo>>({});
export const traffic = van.state<Traffic>({ up: 0, down: 0 });
export const connections = van.state<Connection[]>([]);
export const logs = van.state<LogEntry[]>([]);
export const logLevel = van.state("info");

export const autoConnect = van.state(hasURLParams || !!(localStorage.getItem("clash-api-url")));

export type TabId = "proxies" | "connections" | "logs" | "providers";

function readHash(): TabId {
  const h = location.hash.replace(/^#/, "");
  if (h === "connections" || h === "logs" || h === "providers") return h;
  return "proxies";
}

export const activeTab = van.state<TabId>(readHash());

window.addEventListener("hashchange", () => {
  activeTab.val = readHash();
});

export interface ToastMessage {
  id: number;
  text: string;
  type: "info" | "error" | "success";
}

let toastId = 0;
export const toasts = van.state<ToastMessage[]>([]);

export function showToast(text: string, type: "info" | "error" | "success" = "info") {
  const id = ++toastId;
  toasts.val = [...toasts.val, { id, text, type }];
  setTimeout(() => {
    toasts.val = toasts.val.filter((t) => t.id !== id);
  }, 3000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatSpeed(bytesPerSec: number): string {
  return formatBytes(bytesPerSec) + "/s";
}
