import van from "vanjs-core";
import { proxies, connected, showToast } from "../state";
import { get, put } from "../api";

const { div, span, select, option, button } = van.tags;

interface DelayMap {
  [name: string]: number;
}

export function ProxyList() {
  const baseDelayUrl = "http://www.gstatic.com/generate_204";
  const delay = van.state<DelayMap>({});
  const testing = van.state<Record<string, boolean>>({});

  van.derive(() => {
    if (connected.val) {
      fetchProxies();
    }
  });

  async function fetchProxies() {
    try {
      const data = await get<{ proxies: Record<string, any> }>("/proxies");
      proxies.val = data.proxies || {};
    } catch {
      // silent
    }
  }

  async function switchProxy(group: string, name: string) {
    try {
      await put(`/proxies/${encodeURIComponent(group)}`, { name });
      const updated = { ...proxies.val };
      if (updated[group]) {
        updated[group] = { ...updated[group], now: name };
        proxies.val = updated;
      }
      showToast(`Switched to ${name}`, "success");
    } catch (e: any) {
      showToast(`Switch failed: ${e.message}`, "error");
    }
  }

  async function testDelay(proxyName: string) {
    const t = { ...testing.val };
    t[proxyName] = true;
    testing.val = t;

    try {
      const start = performance.now();
      await get(`/proxies/${encodeURIComponent(proxyName)}/delay?url=${encodeURIComponent(baseDelayUrl)}&timeout=5000`);
      const elapsed = Math.round(performance.now() - start);
      const d = { ...delay.val };
      d[proxyName] = elapsed;
      delay.val = d;
    } catch {
      const d = { ...delay.val };
      d[proxyName] = -1;
      delay.val = d;
    } finally {
      const t2 = { ...testing.val };
      t2[proxyName] = false;
      testing.val = t2;
    }
  }

  function isProxyGroup(info: any): boolean {
    return info.type === "Selector" || info.type === "URLTest" || info.type === "Fallback";
  }

  return div(
    { class: "panel" },
    div(
      { class: "panel-header" },
      span("Proxy Groups")
    ),
    () => {
      const items = Object.entries(proxies.val).filter(([_, info]) => isProxyGroup(info));
      if (items.length === 0) {
        return div({ class: "empty-state" }, "Loading proxy groups...");
      }
      return span(
        ...items.map(([name, info]) => {
          return div(
            { class: "proxy-group" },
            div(
              { class: "proxy-group-header" },
              span({ class: "proxy-group-name" }, name),
              select(
                {
                  class: "proxy-select",
                  onchange: (e: Event) => {
                    const target = e.target as HTMLSelectElement;
                    switchProxy(name, target.value);
                  },
                },
                (info.all || []).map((n: string) =>
                  option({ value: n, selected: n === info.now }, n)
                )
              ),
              span(
                { class: "proxy-delay" },
                () => {
                  const d = delay.val[info.now || ""];
                  if (d === undefined) return "";
                  if (d === -1) return "Timeout";
                  return `${d}ms`;
                }
              ),
              button(
                {
                  class: "btn btn-sm",
                  onclick: () => testDelay(info.now || ""),
                  disabled: () => testing.val[info.now || ""] || !info.now,
                },
                () => testing.val[info.now || ""] ? "Testing..." : "Test"
              )
            )
          );
        })
      );
    }
  );
}
