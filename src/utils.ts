export const DEFAULT_TEST_URL = "http://www.gstatic.com/generate_204";

export function delayClass(ms: number): string {
  if (ms < 0) return "timeout";
  if (ms < 200) return "fast";
  if (ms < 400) return "medium";
  return "slow";
}

export function delayText(ms: number): string {
  if (ms < 0) return "Timeout";
  return `${ms}ms`;
}

export function proxyTypeLabel(type?: string): string {
  if (!type) return "";
  if (type === "Shadowsocks") return "SS";
  if (type === "ShadowsocksR") return "SSR";
  return type.length > 8 ? type.slice(0, 8) + "…" : type;
}
