## 2024-09-01 - Avoid Chained Array Methods in Hot Paths
**Learning:** Chaining `.filter(condition).length` multiple times inside a `useMemo` hook (especially on potentially large arrays like file contexts) leads to multiple unnecessary array iterations and allocates intermediate throwaway arrays in memory. In a React application, this pattern causes excess garbage collection and CPU overhead during frequent re-renders.
**Action:** Replace multiple chained array traversals with a single `for` loop that counts all needed states in a single O(N) pass.
