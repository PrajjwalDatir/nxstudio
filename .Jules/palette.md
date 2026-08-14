## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<label>` and `<input>`/`<textarea>` elements.

## 2024-05-24 - Missing ARIA Labels for Icon-Only Buttons
**Learning:** The codebase frequently uses raw text characters like '✕' for UI icons rather than standard SVGs. This necessitates adding explicit `aria-label` attributes to ensure screen reader accessibility. I found several close buttons and a clear search button missing this crucial attribute.
**Action:** Always verify that buttons containing only text characters or icons have an appropriate `aria-label` attribute (e.g., `aria-label="Close"` or `aria-label="Clear search"`).
