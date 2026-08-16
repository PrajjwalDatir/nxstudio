## 2026-08-03 - Spatial Hash Grid Optimization
**Learning:** Constructing string keys inside tight loops (like `getNearby` running for hundreds of particles every frame) generates immense garbage collection pressure which can cause layout thrashing and lower framerates.
**Action:** When mapping 2D grid coordinates to a hash map in a high-frequency loop, use bitwise shifts (e.g. `(x << 16) | (y & 0xFFFF)`) and `Map<number, V>` to generate integer keys instead of interpolating strings like `x:y`.
## 2026-08-04 - P5.js Color Object Allocation Overhead
**Learning:** Calling `p.color(string)` inside tight, high-frequency rendering loops (like drawing particle connections every frame) causes immense garbage collection pressure because it has to parse the color string and allocate a new object repeatedly.
**Action:** Hoist the color object initialization outside the loop (e.g. `const ink = p.color(primary)`) and reuse the single object by updating its properties (e.g. `ink.setAlpha(alpha)`) inside the loop.
## 2026-08-05 - Inefficient Array and Map Grouping Patterns
**Learning:** Common codebase patterns for grouping components, like `projects.filter(...)` inside `collections.map(...)` and using array spreads (`[...prev, next]`) inside a loop over a `Map`, introduce accidental O(N*M) or O(N²) scaling behavior that drastically lowers React performance under high data loads.
**Action:** Replace nested `.filter` operations inside render loops or maps with a single O(N) traversal populating a `Map`. Avoid spreading arrays in a loop; use O(1) `.push()` on properly initialized arrays instead.
