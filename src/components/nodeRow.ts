import van from "vanjs-core";
import { delayClass, delayText } from "../utils";

const { div, span, button } = van.tags;

export interface DelaySource {
  delay: () => number;
  testing: () => boolean;
  onTest: () => void;
}

export interface NodeRowProps {
  name: string;
  type?: string;
  delaySource: DelaySource;
  selectable?: string;     // truthy → show ●/○ indicator, make row clickable
  isCurrent?: boolean;     // highlight as selected (requires selectable)
  onClick?: () => void;    // row click handler (requires selectable)
}

export function NodeRow({ name, type, delaySource, selectable, isCurrent, onClick }: NodeRowProps) {
  const rowClass = () => `node-row${selectable ? " selectable" : ""}${isCurrent ? " selected" : ""}`;
  const indicator = isCurrent ? "●" : "○";

  const props: Record<string, any> = { class: rowClass };
  if (onClick) props.onclick = onClick;

  return div(
    props,
    selectable ? span({ class: "node-indicator" }, indicator) : null,
    span({ class: "node-name" }, name),
    type ? span({ class: "node-type" }, type) : null,
    span(
      { class: () => `node-delay ${delayClass(delaySource.delay())}` },
      () => {
        const d = delaySource.delay();
        if (d === -2) return "";
        return delayText(d);
      }
    ),
    button(
      {
        class: "btn btn-sm",
        onclick: (e: Event) => {
          e.stopPropagation();
          delaySource.onTest();
        },
        disabled: delaySource.testing,
      },
      () => delaySource.testing() ? "..." : "Test"
    )
  );
}
