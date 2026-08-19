## 2026-08-03 - Spatial Hash Grid Optimization
**Learning:** Constructing string keys inside tight loops (like `getNearby` running for hundreds of particles every frame) generates immense garbage collection pressure which can cause layout thrashing and lower framerates.
**Action:** When mapping 2D grid coordinates to a hash map in a high-frequency loop, use bitwise shifts (e.g. `(x << 16) | (y & 0xFFFF)`) and `Map<number, V>` to generate integer keys instead of interpolating strings like `x:y`.
## 2026-08-04 - P5.js Color Object Allocation Overhead
**Learning:** Calling `p.color(string)` inside tight, high-frequency rendering loops (like drawing particle connections every frame) causes immense garbage collection pressure because it has to parse the color string and allocate a new object repeatedly.
**Action:** Hoist the color object initialization outside the loop (e.g. `const ink = p.color(primary)`) and reuse the single object by updating its properties (e.g. `ink.setAlpha(alpha)`) inside the loop.
## 2026-08-05 - Array Spread in Loops Overhead
**Learning:** Using the array spread operator `[...prev, next]` inside loops (e.g. `map.set(key, [...(map.get(key) ?? []), item])`) leads to O(N^2) time complexity because a new array is allocated and all existing elements are copied on every iteration. This causes significant garbage collection pressure and can be a silent performance killer.
**Action:** Always initialize an array once and use `.push()` to append items inside loops.
