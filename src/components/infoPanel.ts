import van from "vanjs-core";
import { connected, traffic, apiUrl, formatBytes } from "../state";
import { get } from "../api";

const { div, span, button } = van.tags;

interface VersionInfo {
  meta: boolean;
  version: string;
}

interface ConfigInfo {
  mode?: string;
  "log-level"?: string;
  ipv6?: boolean;
  "allow-lan"?: boolean;
  sniffing?: boolean;
  "mixed-port"?: number;
  port?: number;
  "socks-port"?: number;
  "unified-delay"?: boolean;
  tun?: { enable?: boolean };
}

export function InfoPanel() {
  const version = van.state<VersionInfo | null>(null);
  const config = van.state<ConfigInfo | null>(null);
  const loading = van.state(true);

  van.derive(() => {
    if (connected.val) {
      fetchAll();
    }
  });

  async function fetchAll() {
    loading.val = true;
    const [v, c] = await Promise.all([
      get<VersionInfo>("/version").catch(() => null),
      get<ConfigInfo>("/configs").catch(() => null),
    ]);
    version.val = v;
    config.val = c;
    loading.val = false;
  }

  const hostDisplay = van.derive(() => {
    try {
      return new URL(apiUrl.val).origin;
    } catch {
      return apiUrl.val;
    }
  });

  function boolLabel(v?: boolean): string {
    if (v === undefined) return "—";
    return v ? "Yes" : "No";
  }

  function portLabel(v?: number): string {
    if (v === undefined || v === 0) return "—";
    return String(v);
  }

  return div(
    { class: "panel" },
    div(
      { class: "panel-header" },
      span("Info")
    ),
    () => {
      if (loading.val) {
        return div({ class: "empty-state" }, "Loading...");
      }

      const v = version.val;
      const c = config.val;

      return div(
        { class: "info-grid" },
        div({ class: "info-section" }, "Connection"),
        div({ class: "info-row" },
          span({ class: "info-label" }, "Endpoint"),
          span({ class: "info-value" }, () => hostDisplay.val)
        ),
        div({ class: "info-row" },
          span({ class: "info-label" }, "Version"),
          span({ class: "info-value" }, v ? `mihomo ${v.version}` : "—")
        ),

        c ? div({ class: "info-section" }, "Runtime") : null,
        c ? div({ class: "info-row" },
          span({ class: "info-label" }, "Mode"),
          span({ class: "info-value" }, c.mode || "—")
        ) : null,
        c ? div({ class: "info-row" },
          span({ class: "info-label" }, "Log Level"),
          span({ class: "info-value" }, c["log-level"] || "—")
        ) : null,
        c ? div({ class: "info-row" },
          span({ class: "info-label" }, "IPv6"),
          span({ class: "info-value" }, boolLabel(c.ipv6))
        ) : null,
        c ? div({ class: "info-row" },
          span({ class: "info-label" }, "Allow LAN"),
          span({ class: "info-value" }, boolLabel(c["allow-lan"]))
        ) : null,
        c ? div({ class: "info-row" },
          span({ class: "info-label" }, "Sniffing"),
          span({ class: "info-value" }, boolLabel(c.sniffing))
        ) : null,
        c ? div({ class: "info-row" },
          span({ class: "info-label" }, "Unified Delay"),
          span({ class: "info-value" }, boolLabel(c["unified-delay"]))
        ) : null,
        c ? div({ class: "info-row" },
          span({ class: "info-label" }, "Mixed Port"),
          span({ class: "info-value" }, portLabel(c["mixed-port"]))
        ) : null,
        c ? div({ class: "info-row" },
          span({ class: "info-label" }, "HTTP Port"),
          span({ class: "info-value" }, portLabel(c.port))
        ) : null,
        c ? div({ class: "info-row" },
          span({ class: "info-label" }, "SOCKS Port"),
          span({ class: "info-value" }, portLabel(c["socks-port"]))
        ) : null,
        c ? div({ class: "info-row" },
          span({ class: "info-label" }, "TUN"),
          span({ class: "info-value" }, boolLabel(c.tun?.enable))
        ) : null,

        div({ class: "info-section" }, "Traffic"),
        div({ class: "info-row" },
          span({ class: "info-label" }, "Upload"),
          span({ class: "info-value" }, () => formatBytes(traffic.val.upTotal))
        ),
        div({ class: "info-row" },
          span({ class: "info-label" }, "Download"),
          span({ class: "info-value" }, () => formatBytes(traffic.val.downTotal))
        ),
        button(
          { class: "btn", style: "margin: 12px 14px; align-self: flex-start", onclick: fetchAll },
          loading.val ? "Refreshing..." : "Refresh"
        )
      );
    }
  );
}
