import van from "vanjs-core";
import { connected, connecting, connectionError, toasts, autoConnect, activeTab, TabId } from "./state";
import { checkConnection } from "./api";
import { ConnectPage } from "./components/connect";
import { TopBar } from "./components/topBar";
import { ProxyList } from "./components/proxyList";
import { ConnectionTable } from "./components/connectionTable";
import { LogPanel } from "./components/logPanel";
import { ProviderList } from "./components/providerList";
import { InfoPanel } from "./components/infoPanel";

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

const TABS: { id: TabId; label: string }[] = [
  { id: "proxies", label: "Proxies" },
  { id: "providers", label: "Providers" },
  { id: "connections", label: "Connections" },
  { id: "logs", label: "Logs" },
  { id: "info", label: "Info" },
];

function TabBar() {
  return div(
    { class: "tabs" },
    ...TABS.map((t) =>
      div(
        {
          class: () => `tab ${activeTab.val === t.id ? "tab-active" : ""}`,
          onclick: () => {
            activeTab.val = t.id;
            if (t.id === "proxies") {
              history.replaceState(null, "", location.pathname + location.search);
            } else {
              location.hash = t.id;
            }
          },
        },
        t.label
      )
    )
  );
}

function MainDashboard() {
  return div(
    TopBar(),
    TabBar(),
    div(
      { class: () => `tab-panel ${activeTab.val === "proxies" ? "tab-panel-active" : ""}` },
      ProxyList()
    ),
    div(
      { class: () => `tab-panel ${activeTab.val === "providers" ? "tab-panel-active" : ""}` },
      ProviderList()
    ),
    div(
      { class: () => `tab-panel ${activeTab.val === "connections" ? "tab-panel-active" : ""}` },
      ConnectionTable()
    ),
    div(
      { class: () => `tab-panel ${activeTab.val === "logs" ? "tab-panel-active" : ""}` },
      LogPanel()
    ),
    div(
      { class: () => `tab-panel ${activeTab.val === "info" ? "tab-panel-active" : ""}` },
      InfoPanel()
    )
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
