import { apiUrl, secret, connectionError } from "./state";

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret.val) {
    headers["Authorization"] = `Bearer ${secret.val}`;
  }

  const url = apiUrl.val + path;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ": " + text : ""}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function get<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export async function put(path: string, body: unknown): Promise<void> {
  await request<void>("PUT", path, body);
}

export async function del(path: string): Promise<void> {
  await request<void>("DELETE", path);
}

export function ws(
  path: string,
  onMessage: (data: any) => void
): WebSocket {
  const protocol = apiUrl.val.startsWith("https") ? "wss" : "ws";
  const baseUrl = apiUrl.val.replace(/^https?:\/\//, "");
  const sep = path.includes("?") ? "&" : "?";
  const tokenParam = secret.val ? `${sep}token=${encodeURIComponent(secret.val)}` : "";
  const wsUrl = `${protocol}://${baseUrl}${path}${tokenParam}`;

  const socket = new WebSocket(wsUrl);

  socket.addEventListener("open", () => {
    connectionError.val = "";
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {
      // ignore non-JSON messages
    }
  });

  socket.addEventListener("error", () => {
    connectionError.val = "WebSocket connection error";
  });

  socket.addEventListener("close", () => {
    // reconnect handled by caller
  });

  return socket;
}

export async function checkConnection(): Promise<boolean> {
  try {
    await get("/version");
    return true;
  } catch {
    return false;
  }
}
