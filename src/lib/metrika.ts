const COUNTER_ID = 112838914;

type MetrikaGoal = "form_submit" | "order_placed" | "phone_click" | "add_to_cart";

export function reachGoal(goal: MetrikaGoal, params?: Record<string, unknown>) {
  const ym = (window as unknown as { ym?: (...args: unknown[]) => void }).ym;
  if (typeof ym !== "function") return;
  try {
    ym(COUNTER_ID, "reachGoal", goal, params);
  } catch {
    /* noop */
  }
}

/** Отслеживает клики по любым ссылкам tel: на сайте. */
export function initPhoneClickTracking() {
  const handler = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    const link = target?.closest?.("a[href^='tel:']");
    if (link) reachGoal("phone_click");
  };
  document.addEventListener("click", handler, true);
  return () => document.removeEventListener("click", handler, true);
}
