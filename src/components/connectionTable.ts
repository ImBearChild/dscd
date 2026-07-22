import van from "vanjs-core";
import { connections, connected, formatBytes } from "../state";
import { get, del } from "../api";

const { div, span, table, thead, tbody, tr, th, td, button } = van.tags;

export function ConnectionTable() {
  let pollTimer: number | null = null;

  function startPolling() {
    if (pollTimer !== null) return;
    fetchConnections();
    pollTimer = window.setInterval(fetchConnections, 1000);
  }

  function stopPolling() {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  van.derive(() => {
    if (connected.val) {
      startPolling();
    } else {
      stopPolling();
    }
  });

  async function fetchConnections() {
    try {
      const data = await get<{ connections: any[] }>("/connections");
      connections.val = data.connections || [];
    } catch {
      // silent
    }
  }

  async function closeAll() {
    try {
      await del("/connections");
      connections.val = [];
    } catch {
      // silent
    }
  }

  function chainDisplay(chains: string[]): string {
    if (!chains || chains.length === 0) return "Direct";
    return chains.join(" → ");
  }

  return div(
    { class: "panel" },
    div(
      { class: "panel-header" },
      span(() => `Active Connections (${connections.val.length})`),
      button(
        { class: "btn btn-sm btn-danger", onclick: closeAll },
        "Close All"
      )
    ),
    () => {
      const conns = connections.val;
      if (conns.length === 0) {
        return div({ class: "empty-state" }, "No active connections");
      }
      return table(
        { class: "conn-table" },
        thead(
          tr(
            th("Target"),
            th("Chain"),
            th("Rule"),
            th("Upload"),
            th("Download")
          )
        ),
        tbody(
          conns.map((c) =>
            tr(
              td(`${c.metadata.host || c.metadata.destinationIP}:${c.metadata.destinationPort}`),
              td({ class: "chain" }, chainDisplay(c.chains)),
              td(c.rule || "-"),
              td(formatBytes(c.upload)),
              td(formatBytes(c.download))
            )
          )
        )
      );
    }
  );
}
