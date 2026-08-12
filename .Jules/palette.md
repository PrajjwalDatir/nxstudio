## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<label>` and `<input>`/`<textarea>` elements.

## 2025-02-09 - Missing aria-labels on generic text-character buttons
**Learning:** Found that custom modal implementations and inline search inputs frequently use text characters like "✕" for clear/close actions without explicit `aria-label`s. Because these characters are not standard SVG icons (which might have `title`s or be naturally hidden), screen readers can announce them poorly or out of context.
**Action:** When implementing custom modals or inline clear buttons using character strings like "✕", ensure they are wrapped in a `<button>` with an explicit, context-aware `aria-label` (e.g. `aria-label="Close dialog"` or `aria-label="Clear search"`).
