## 2026-08-03 - Spatial Hash Grid Optimization
**Learning:** Constructing string keys inside tight loops (like `getNearby` running for hundreds of particles every frame) generates immense garbage collection pressure which can cause layout thrashing and lower framerates.
**Action:** When mapping 2D grid coordinates to a hash map in a high-frequency loop, use bitwise shifts (e.g. `(x << 16) | (y & 0xFFFF)`) and `Map<number, V>` to generate integer keys instead of interpolating strings like `x:y`.
## 2026-08-04 - P5.js Color Object Allocation Overhead
**Learning:** Calling `p.color(string)` inside tight, high-frequency rendering loops (like drawing particle connections every frame) causes immense garbage collection pressure because it has to parse the color string and allocate a new object repeatedly.
**Action:** Hoist the color object initialization outside the loop (e.g. `const ink = p.color(primary)`) and reuse the single object by updating its properties (e.g. `ink.setAlpha(alpha)`) inside the loop.
## 2026-08-04 - React.memo Optimization
**Learning:** React re-renders components inside highly interactive applications frequently. While React doesn't recreate DOM nodes (like a p5 canvas attached via ref) on every re-render, running a component's render function and internal hooks, and diffing its VDOM still carries an overhead.
**Action:** When a component manages its own complex external state (like a p5 instance) and doesn't need to respond to all parent re-renders, wrap it in `React.memo` to completely bypass unnecessary execution and VDOM diffing.
