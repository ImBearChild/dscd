import van from "vanjs-core";
import { connected, connecting, connectionError, toasts, autoConnect } from "./state";
import { checkConnection } from "./api";
import { ConnectPage } from "./components/connect";
import { TopBar } from "./components/topBar";
import { ProxyList } from "./components/proxyList";
import { ConnectionTable } from "./components/connectionTable";
import { LogPanel } from "./components/logPanel";

const { div, span } = van.tags;

async function tryAutoConnect(): Promise<boolean> {
  connecting.val = true;
  connectionError.val = "";
  const ok = await checkConnection();
  connecting.val = false;
  if (ok) {
    connected.val = true;
    return true;
  }
  return false;
}

function ToastContainer() {
  return div(
    { class: "toast-container" },
    () =>
      span(
        ...toasts.val.map((t) =>
          div({ class: `toast toast-${t.type}` }, t.text)
        )
      )
  );
}

function MainDashboard() {
  return div(
    TopBar(),
    ProxyList(),
    ConnectionTable(),
    LogPanel()
  );
}

function App() {
  return div(
    () => {
      if (connected.val) return MainDashboard();
      if (connecting.val) return div({ class: "connect-page" }, div({ class: "connect-card" }, span("Connecting...")));
      return ConnectPage();
    },
    ToastContainer()
  );
}

async function init() {
  const appEl = document.getElementById("app");
  if (!appEl) return;

  van.add(appEl, App());

  if (autoConnect.val) {
    await tryAutoConnect();
  }
}

init();
