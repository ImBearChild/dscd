import van from "vanjs-core";
import { logs, logLevel, connected } from "../state";
import { ws } from "../api";

const { div, span, select, option, button } = van.tags;

const MAX_LOGS = 500;
const LOG_LEVELS = ["debug", "info", "warning", "error"];

export function LogPanel() {
  let closeSocket: (() => void) | null = null;

  function stopStream() {
    if (closeSocket) {
      closeSocket();
      closeSocket = null;
    }
  }

  function startStream() {
    stopStream();

    const s = ws(`/logs?level=${logLevel.val}`, (data: any) => {
      const entry = typeof data === "string" ? { type: "info", payload: data } : data;
      const current = logs.val;
      const updated = [...current, entry];
      if (updated.length > MAX_LOGS) {
        updated.splice(0, updated.length - MAX_LOGS);
      }
      logs.val = updated;
    });

    closeSocket = () => s.close();
  }

  van.derive(() => {
    if (connected.val) {
      void logLevel.val;
      startStream();
    } else {
      stopStream();
    }
  });

  function formatTime(): string {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  function pad(n: number): string {
    return n < 10 ? "0" + n : String(n);
  }

  function clearLogs() {
    logs.val = [];
  }

  return div(
    { class: "panel" },
    div(
      { class: "panel-header" },
      span("Logs"),
      div(
        { style: "display:flex;gap:8px;align-items:center;" },
        select(
          {
            class: "proxy-select",
            style: "width:auto;",
            onchange: (e: Event) => {
              logLevel.val = (e.target as HTMLSelectElement).value;
            },
          },
          LOG_LEVELS.map((l) =>
            option({ value: l, selected: l === logLevel.val }, l)
          )
        ),
        button({ class: "btn btn-sm", onclick: clearLogs }, "Clear")
      )
    ),
    div(
      { class: "log-list" },
      () => {
        const entries = logs.val;
        if (entries.length === 0) {
          return div({ class: "empty-state" }, "No logs");
        }
        return span(
          ...entries.map((entry) => {
            const level = (entry.type || "info").toLowerCase();
            return div(
              { class: `log-entry ${level}` },
              span({ class: "log-time" }, formatTime()),
              span(`[${entry.type?.toUpperCase() || "INFO"}] `),
              span(entry.payload || JSON.stringify(entry))
            );
          })
        );
      }
    )
  );
}
