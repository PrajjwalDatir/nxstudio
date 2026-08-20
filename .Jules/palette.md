## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking. This is a common pattern in forms and dialogs in this app.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<\label>` and `<input>`/`<textarea>` elements, rather than relying exclusively on implicit nesting.

## 2026-08-20 - Text Character Icons Missing ARIA Labels
**Learning:** The codebase frequently utilizes text characters (e.g., '✕') for UI icons rather than standard SVGs (e.g. in `DriftDiffModal`, `NxContextDirectoryModal`, `BuildPhase`). Because these are text nodes and not semantic icon elements, they inherently lack meaning for screen readers without explicit attributes.
**Action:** Always verify that buttons or interactive elements using text characters as icons include an explicit `aria-label` describing their action (e.g., 'Close' or 'Clear search') to ensure accessibility for screen reader users.
