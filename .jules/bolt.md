## 2026-08-03 - Spatial Hash Grid Optimization
**Learning:** Constructing string keys inside tight loops (like `getNearby` running for hundreds of particles every frame) generates immense garbage collection pressure which can cause layout thrashing and lower framerates.
**Action:** When mapping 2D grid coordinates to a hash map in a high-frequency loop, use bitwise shifts (e.g. `(x << 16) | (y & 0xFFFF)`) and `Map<number, V>` to generate integer keys instead of interpolating strings like `x:y`.
## 2026-08-04 - P5.js Color Object Allocation Overhead
**Learning:** Calling `p.color(string)` inside tight, high-frequency rendering loops (like drawing particle connections every frame) causes immense garbage collection pressure because it has to parse the color string and allocate a new object repeatedly.
**Action:** Hoist the color object initialization outside the loop (e.g. `const ink = p.color(primary)`) and reuse the single object by updating its properties (e.g. `ink.setAlpha(alpha)`) inside the loop.
## 2024-08-10 - SpatialHashGrid GC Optimization
**Learning:** Reusing arrays and avoiding new array instantiation in hot paths (like `getNearby` in spatial hashing) drastically reduces garbage collection pressure. Generators (`function*`) inside hot paths also create excessive object allocation (`IteratorResult`) and should be avoided in favor of passing reusable `out` arrays.
**Action:** When working with high-frequency rendering loops, pass a single initialized `out` array into querying methods and use `array.length = 0` to reuse existing memory instead of returning `[]` or using `yield`.
