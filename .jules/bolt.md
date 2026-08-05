## 2026-08-03 - Spatial Hash Grid Optimization
**Learning:** Constructing string keys inside tight loops (like `getNearby` running for hundreds of particles every frame) generates immense garbage collection pressure which can cause layout thrashing and lower framerates.
**Action:** When mapping 2D grid coordinates to a hash map in a high-frequency loop, use bitwise shifts (e.g. `(x << 16) | (y & 0xFFFF)`) and `Map<number, V>` to generate integer keys instead of interpolating strings like `x:y`.
## 2026-08-04 - P5.js Color Object Allocation Overhead
**Learning:** Calling `p.color(string)` inside tight, high-frequency rendering loops (like drawing particle connections every frame) causes immense garbage collection pressure because it has to parse the color string and allocate a new object repeatedly.
**Action:** Hoist the color object initialization outside the loop (e.g. `const ink = p.color(primary)`) and reuse the single object by updating its properties (e.g. `ink.setAlpha(alpha)`) inside the loop.
## 2026-08-05 - Array Allocation in High-Frequency Spatial Loops
**Learning:** `getNearby` being called for hundreds of particles every frame creates many arrays, leading to intense garbage collection pressure. Returning a shared mutable array from a utility method breaks the API contract if callers store the reference.
**Action:** Update high-frequency API methods like `getNearby` to accept an optional `out` array parameter (e.g. `out: Particle2D[] = []`). The caller provides a reusable array, and the method resets its length to 0 (`out.length = 0`) before filling and returning it, eliminating array allocations without breaking safety.
