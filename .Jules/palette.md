## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<label>` and `<input>`/`<textarea>` elements.
## 2026-08-08 - Adding ARIA labels to close buttons
**Learning:** Icon-only close buttons (like '✕') inside custom modal components often lack `aria-label` attributes by default, rendering them inaccessible to screen readers.
**Action:** Always check custom dialog/modal implementations to ensure close buttons have `aria-label="Close"`.
