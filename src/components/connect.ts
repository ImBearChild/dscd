import van from "vanjs-core";
import { apiUrl, secret, connected, connecting, connectionError } from "../state";
import { checkConnection } from "../api";

const { div, h2, label, input, button } = van.tags;

export function ConnectPage() {
  async function handleConnect() {
    const urlEl = document.querySelector<HTMLInputElement>(".connect-page .connect-url-input");
    const secretEl = document.querySelector<HTMLInputElement>(".connect-page .connect-secret-input");
    if (!urlEl) return;

    connectionError.val = "";
    connecting.val = true;

    const newUrl = urlEl.value.replace(/\/$/, "");
    const newSecret = secretEl?.value || "";

    apiUrl.val = newUrl;
    secret.val = newSecret;

    const ok = await checkConnection();
    connecting.val = false;

    if (ok) {
      localStorage.setItem("clash-api-url", newUrl);
      localStorage.setItem("clash-secret", newSecret);
      connected.val = true;
    } else {
      connectionError.val = `Connection failed: unable to reach ${newUrl}/version`;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") handleConnect();
  }

  return div(
    { class: "connect-page" },
    div(
      { class: "connect-card" },
      h2("Clash Dashboard"),
      div(
        { class: "form-group" },
        label("API URL"),
        input({
          type: "text",
          class: "connect-url-input",
          placeholder: "http://127.0.0.1:9090",
          value: apiUrl.val,
          onkeydown: handleKeyDown,
        })
      ),
      div(
        { class: "form-group" },
        label("Secret"),
        input({
          type: "text",
          class: "connect-secret-input",
          placeholder: "Secret (optional)",
          value: secret.val,
          onkeydown: handleKeyDown,
        })
      ),
      button(
        {
          class: "btn btn-accent btn-block",
          onclick: handleConnect,
          disabled: () => connecting.val,
        },
        () => connecting.val ? "Connecting..." : "Connect"
      ),
      () => connectionError.val ? div({ class: "error-msg" }, connectionError.val) : null
    )
  );
}
