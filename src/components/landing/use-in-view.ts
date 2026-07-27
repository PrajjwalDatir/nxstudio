import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether an element is anywhere near the viewport. Used to pause the
 * WebGL canvases' render loop while they're scrolled well out of view — two
 * always-on 3D scenes is the landing page's biggest avoidable GPU/CPU cost, and
 * there's no reason to animate a scene nobody can see.
 *
 * Starts `true` so the scene is live on first paint (before the observer fires),
 * and keeps a generous rootMargin so it resumes a little before it scrolls in.
 */
export function useInView<T extends HTMLElement>(rootMargin = "300px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
