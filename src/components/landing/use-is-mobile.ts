import { useEffect, useState } from "react";

/**
 * True below the `md` breakpoint (max-width: 767px).
 *
 * Starts `false` so the server render and the first client render agree — the
 * effect corrects it on mount, before any lazy WebGL scene has loaded, so there
 * is no visible jump. Used both to reframe the hero unit and to cap how many
 * WebGL contexts are live at once on phones (see the scene mount-gating): mobile
 * GPUs evict contexts when three heavy canvases are mounted together, so on
 * mobile we mount only the scene currently in view.
 */
export function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}
