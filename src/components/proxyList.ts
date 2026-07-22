import van from "vanjs-core";
import { proxies, connected, showToast } from "../state";
import { get, put } from "../api";
import { DEFAULT_TEST_URL, proxyTypeLabel } from "../utils";
import { NodeRow } from "./nodeRow";

const { div, span, button } = van.tags;

interface DelayMap {
  [name: string]: number;
}

export function ProxyList() {
  const delay = van.state<DelayMap>({});
  const testing = van.state<Record<string, boolean>>({});
  const groupTesting = van.state<Record<string, boolean>>({});
  const collapsed = van.state<Record<string, boolean>>({});

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

  async function testGroupDelay(groupName: string, testUrl?: string) {
    const gt = { ...groupTesting.val };
    gt[groupName] = true;
    groupTesting.val = gt;

    const url = testUrl || DEFAULT_TEST_URL;

    try {
      const data = await get<Record<string, number>>(
        `/group/${encodeURIComponent(groupName)}/delay?url=${encodeURIComponent(url)}&timeout=5000`
      );
      const d = { ...delay.val };
      for (const [name, ms] of Object.entries(data)) {
        d[name] = ms > 0 ? ms : -1;
      }
      delay.val = d;
    } catch {
      showToast(`Group test failed for ${groupName}`, "error");
    } finally {
      const gt2 = { ...groupTesting.val };
      gt2[groupName] = false;
      groupTesting.val = gt2;
    }
  }

  function isProxyGroup(info: any): boolean {
    return info.type === "Selector" || info.type === "URLTest" || info.type === "Fallback";
  }

  function toggleCollapse(groupName: string) {
    const c = { ...collapsed.val };
    c[groupName] = !c[groupName];
    collapsed.val = c;
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
              {
                class: () => `proxy-group-header ${collapsed.val[name] ? "collapsed" : ""}`,
                onclick: () => toggleCollapse(name),
              },
              span({ class: "proxy-group-name" }, name),
              span({ class: "proxy-group-now" }, info.now || ""),
              div({ class: "proxy-group-spacer" }),
              button(
                {
                  class: "btn btn-sm",
                  onclick: (e: Event) => {
                    e.stopPropagation();
                    testGroupDelay(name, info.testUrl);
                  },
                  disabled: () => groupTesting.val[name],
                },
                () => groupTesting.val[name] ? "Testing..." : "Test All"
              ),
              span({ class: "proxy-group-arrow" }, "▼")
            ),
            div(
              { class: () => `proxy-nodes ${collapsed.val[name] ? "collapsed" : ""}` },
              ...(info.all || []).map((nodeName: string) =>
                NodeRow({
                  name: nodeName,
                  type: proxyTypeLabel(proxies.val[nodeName]?.type),
                  delaySource: {
                    delay: () => delay.val[nodeName] ?? -2,
                    testing: () => testing.val[nodeName],
                    onTest: () => testDelay(nodeName),
                  },
                  selectable: "y",
                  isCurrent: nodeName === info.now,
                  onClick: () => switchProxy(name, nodeName),
                })
              )
            )
          );
        })
      );
    }
  );
}
