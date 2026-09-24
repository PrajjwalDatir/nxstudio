## 2026-08-03 - Spatial Hash Grid Optimization
**Learning:** Constructing string keys inside tight loops (like `getNearby` running for hundreds of particles every frame) generates immense garbage collection pressure which can cause layout thrashing and lower framerates.
**Action:** When mapping 2D grid coordinates to a hash map in a high-frequency loop, use bitwise shifts (e.g. `(x << 16) | (y & 0xFFFF)`) and `Map<number, V>` to generate integer keys instead of interpolating strings like `x:y`.
## 2026-08-04 - P5.js Color Object Allocation Overhead
**Learning:** Calling `p.color(string)` inside tight, high-frequency rendering loops (like drawing particle connections every frame) causes immense garbage collection pressure because it has to parse the color string and allocate a new object repeatedly.
**Action:** Hoist the color object initialization outside the loop (e.g. `const ink = p.color(primary)`) and reuse the single object by updating its properties (e.g. `ink.setAlpha(alpha)`) inside the loop.
## 2026-08-04 - React.memo Optimization
**Learning:** React re-renders components inside highly interactive applications frequently. While React doesn't recreate DOM nodes (like a p5 canvas attached via ref) on every re-render, running a component's render function and internal hooks, and diffing its VDOM still carries an overhead.
**Action:** When a component manages its own complex external state (like a p5 instance) and doesn't need to respond to all parent re-renders, wrap it in `React.memo` to completely bypass unnecessary execution and VDOM diffing.
## 2026-08-05 - Array Spread in Loops Overhead
**Learning:** Using the array spread operator `[...prev, next]` inside loops (e.g. `map.set(key, [...(map.get(key) ?? []), item])`) leads to O(N^2) time complexity because a new array is allocated and all existing elements are copied on every iteration. This causes significant garbage collection pressure and can be a silent performance killer.
**Action:** Always initialize an array once and use `.push()` to append items inside loops.
## 2026-08-06 - Nested Array Filter inside Map Overheads
**Learning:** Using `.filter()` inside the callback of a `.map()` mapping over an array (e.g. `items.map(i => otherArray.filter(o => o.id === i.id))`) causes an O(N*M) runtime complexity. When performed inside a React `useMemo`, this can be a sneaky performance bottleneck blocking main thread renders as datasets grow.
**Action:** Use a single O(N) pass to construct a `Map` that groups items by key (using `.push()` to an array for each key), then query the `Map` in O(1) time within the `.map()` loop.

## 2026-08-07 - Preserving API signatures during O(N) optimizations
**Learning:** When optimizing nested O(N*M) lookups inside React hooks by extracting inner searches (like `.findIndex`) into a pre-computed `Map`, modifying inner helper functions to require those Map lookups can break existing abstractions or call sites that still rely on the original behavior.
**Action:** When optimizing an internal helper function (e.g., `getFieldSocketPos`), modify its signature to accept optional pre-computed indices (`providedTableIndex?: number`) instead of hardcoding Map lookups or magic numbers directly. This allows callers with a Map to bypass the O(N) search while preserving the original fallback behavior (`?? array.findIndex()`) for backward compatibility.
