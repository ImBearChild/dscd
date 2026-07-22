import van from "vanjs-core";
import { traffic, connected, apiUrl, formatSpeed } from "../state";
import { ws } from "../api";

const { div, span } = van.tags;

export function TopBar() {
  let prevUp = 0;
  let prevDown = 0;
  let wsActive = false;
  let closeWs: (() => void) | null = null;

  function startTrafficMonitor() {
    if (wsActive) return;
    wsActive = true;
    const socket = ws("/traffic", (data: { up: number; down: number; upTotal?: number; downTotal?: number }) => {
      traffic.val = { up: data.up - prevUp, down: data.down - prevDown, upTotal: data.upTotal ?? 0, downTotal: data.downTotal ?? 0 };
      prevUp = data.up;
      prevDown = data.down;
    });
    closeWs = () => { socket.close(); };
  }

  function stopTrafficMonitor() {
    wsActive = false;
    if (closeWs) {
      closeWs();
      closeWs = null;
    }
  }

  van.derive(() => {
    if (connected.val) {
      startTrafficMonitor();
    } else {
      stopTrafficMonitor();
    }
  });

  const hostDisplay = van.derive(() => {
    try {
      return new URL(apiUrl.val).host;
    } catch {
      return apiUrl.val;
    }
  });

  return div(
    { class: "top-bar" },
    div(
      { class: "traffic-info" },
      () =>
        connected.val
          ? span(
              span({ class: "up" }, () => `↑ ${formatSpeed(traffic.val.up)}`),
              span({ class: "down" }, () => `↓ ${formatSpeed(traffic.val.down)}`),
            )
          : null
    ),
    div(
      { class: "connection-status" },
      () =>
        connected.val
          ? span(
              span({ class: "dot" }),
              span(() => `Connected to ${hostDisplay.val}`),
            )
          : span("Disconnected")
    )
  );
}
