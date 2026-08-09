## 2026-08-03 - Spatial Hash Grid Optimization
**Learning:** Constructing string keys inside tight loops (like `getNearby` running for hundreds of particles every frame) generates immense garbage collection pressure which can cause layout thrashing and lower framerates.
**Action:** When mapping 2D grid coordinates to a hash map in a high-frequency loop, use bitwise shifts (e.g. `(x << 16) | (y & 0xFFFF)`) and `Map<number, V>` to generate integer keys instead of interpolating strings like `x:y`.
## 2026-08-04 - P5.js Color Object Allocation Overhead
**Learning:** Calling `p.color(string)` inside tight, high-frequency rendering loops (like drawing particle connections every frame) causes immense garbage collection pressure because it has to parse the color string and allocate a new object repeatedly.
**Action:** Hoist the color object initialization outside the loop (e.g. `const ink = p.color(primary)`) and reuse the single object by updating its properties (e.g. `ink.setAlpha(alpha)`) inside the loop.
## 2026-08-05 - P5.js lerpColor Object Allocation Overhead in Loops
**Learning:** Calling `p.lerpColor` inside tight, high-frequency rendering loops (like drawing grid cells based on a noise field) causes immense garbage collection pressure because it returns a new `p5.Color` object on every call. In an 800x600 canvas with a step of 24, this causes ~825 new object allocations per frame.
**Action:** Extract the RGB components of the start and end colors outside the loop using `p.red()`, `p.green()`, and `p.blue()`, and manually interpolate them inside the loop using simple arithmetic (e.g. `r1 + (r2 - r1) * n`). Pass the resulting values directly to `p.fill(r, g, b)`.
