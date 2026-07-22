import van from "vanjs-core";
import { providers, connected, showToast, formatBytes, ProviderInfo, ProxyInfo } from "../state";
import { get, put } from "../api";
import { DEFAULT_TEST_URL, proxyTypeLabel } from "../utils";
import { NodeRow } from "./nodeRow";

const { div, span, button } = van.tags;

export function ProviderList() {
  const delay = van.state<Record<string, number>>({});
  const testing = van.state<Record<string, boolean>>({});
  const updating = van.state<Record<string, boolean>>({});
  const nodesOpen = van.state<Record<string, boolean>>({});

  van.derive(() => {
    if (connected.val) {
      fetchProviders();
    }
  });

  async function fetchProviders() {
    try {
      const data = await get<{ providers: Record<string, ProviderInfo> }>("/providers/proxies");
      providers.val = data.providers || {};
    } catch {
      // silent
    }
  }

  async function updateProvider(providerName: string) {
    const u = { ...updating.val };
    u[providerName] = true;
    updating.val = u;
    try {
      await put(`/providers/proxies/${encodeURIComponent(providerName)}`, null as any);
      showToast(`${providerName} updated`, "success");
      await fetchProviders();
    } catch (e: any) {
      showToast(`Update failed: ${e.message}`, "error");
    } finally {
      const u2 = { ...updating.val };
      u2[providerName] = false;
      updating.val = u2;
    }
  }

  async function testDelay(proxyName: string) {
    const t = { ...testing.val };
    t[proxyName] = true;
    testing.val = t;
    try {
      const data = await get<{ delay: number }>(
        `/proxies/${encodeURIComponent(proxyName)}/delay?url=${encodeURIComponent(DEFAULT_TEST_URL)}&timeout=5000`
      );
      const d = { ...delay.val };
      d[proxyName] = data.delay > 0 ? data.delay : -1;
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

  function toggleNodes(providerName: string) {
    const n = { ...nodesOpen.val };
    n[providerName] = !n[providerName];
    nodesOpen.val = n;
  }

  function formatExpire(ts?: number): string {
    if (!ts) return "—";
    const expire = new Date(ts * 1000);
    const now = Date.now();
    const days = Math.ceil((expire.getTime() - now) / (1000 * 60 * 60 * 24));
    const dateStr = expire.toLocaleDateString();
    if (days < 0) return `${dateStr} (expired)`;
    return `${dateStr} (${days} days)`;
  }

  function formatUpdated(updatedAt?: string): string {
    if (!updatedAt) return "—";
    const d = new Date(updatedAt);
    return d.toLocaleString();
  }

  return div(
    { class: "panel" },
    div(
      { class: "panel-header" },
      span("Proxy Providers")
    ),
    () => {
      const items = Object.entries(providers.val).filter(([_, p]) => p.vehicleType !== "Compatible");
      if (items.length === 0) {
        return div({ class: "empty-state" }, "Loading proxy providers...");
      }
      return span(
        ...items.map(([name, p]) => {
          const sub = p.subscriptionInfo;
          const nodeCount = (p.proxies || []).length;
          const nodesExpanded = () => !!nodesOpen.val[name];

          return div(
            { class: "provider-card" },
            div(
              { class: "provider-header" },
              span({ class: "provider-name" }, name),
              span({ class: "provider-badge" }, p.vehicleType),
              div({ class: "provider-spacer" }),
              button(
                {
                  class: "btn btn-sm",
                  onclick: () => updateProvider(name),
                  disabled: () => updating.val[name],
                },
                () => updating.val[name] ? "Updating..." : "Update"
              )
            ),
            div(
              { class: "provider-meta" },
              div({ class: "provider-meta-row" },
                span({ class: "provider-meta-label" }, "Updated"),
                span({ class: "provider-meta-value" }, formatUpdated(p.updatedAt))
              ),
              sub && (sub.Upload != null || sub.Download != null || sub.Total != null) ? div(
                { class: "provider-meta-row" },
                span({ class: "provider-meta-label" }, "Traffic"),
                span(
                  { class: "provider-meta-value" },
                  `↑ ${formatBytes(sub.Upload ?? 0)}  ↓ ${formatBytes(sub.Download ?? 0)}  / ${formatBytes(sub.Total ?? 0)}`
                )
              ) : null,
              sub && sub.Expire != null && sub.Expire > 0 ? div(
                { class: "provider-meta-row" },
                span({ class: "provider-meta-label" }, "Expires"),
                span({ class: "provider-meta-value" }, formatExpire(sub.Expire!))
              ) : null
            ),
            nodeCount > 0 ? div(
              {
                class: "provider-nodes-toggle",
                onclick: () => toggleNodes(name),
              },
              span(`Nodes: ${nodeCount}`),
              span(
                { class: () => `provider-nodes-arrow ${nodesExpanded() ? "open" : ""}` },
                "▼"
              )
            ) : null,
            nodeCount > 0 ? div(
              { class: () => `provider-nodes ${nodesExpanded() ? "open" : ""}` },
              ...p.proxies.map((proxy: ProxyInfo) =>
                NodeRow({
                  name: proxy.name,
                  type: proxyTypeLabel(proxy.type),
                  delaySource: {
                    delay: () => {
                      const manual = delay.val[proxy.name];
                      if (manual !== undefined) return manual;
                      if (proxy.history && proxy.history.length > 0) {
                        return proxy.history[proxy.history.length - 1].delay;
                      }
                      return -2;
                    },
                    testing: () => testing.val[proxy.name],
                    onTest: () => testDelay(proxy.name),
                  },
                })
              )
            ) : null
          );
        })
      );
    }
  );
}
