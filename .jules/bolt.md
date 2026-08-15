## 2026-08-03 - Spatial Hash Grid Optimization
**Learning:** Constructing string keys inside tight loops (like `getNearby` running for hundreds of particles every frame) generates immense garbage collection pressure which can cause layout thrashing and lower framerates.
**Action:** When mapping 2D grid coordinates to a hash map in a high-frequency loop, use bitwise shifts (e.g. `(x << 16) | (y & 0xFFFF)`) and `Map<number, V>` to generate integer keys instead of interpolating strings like `x:y`.
## 2026-08-04 - P5.js Color Object Allocation Overhead
**Learning:** Calling `p.color(string)` inside tight, high-frequency rendering loops (like drawing particle connections every frame) causes immense garbage collection pressure because it has to parse the color string and allocate a new object repeatedly.
**Action:** Hoist the color object initialization outside the loop (e.g. `const ink = p.color(primary)`) and reuse the single object by updating its properties (e.g. `ink.setAlpha(alpha)`) inside the loop.
## 2023-10-27 - O(N*M) nested filter optimization
**Learning:** React useMemo hooks often harbor hidden O(N*M) bottlenecks when mapping over a list (like `collections`) and filtering a larger list (like `projects`) inside the map callback.
**Action:** Always refactor nested `.filter()` inside `.map()` to a single pass using a `Map` to group items (O(N) grouping).

## 2023-10-27 - O(N^2) Array spread optimization inside loops
**Learning:** Using the spread operator inside a loop to append to an array (`[...prev, next]`) creates O(N^2) time complexity and massive memory churn because it copies the entire array every iteration.
**Action:** For grouping elements in a loop, initialize an array and use `.push()`, which is O(1) amortized.
