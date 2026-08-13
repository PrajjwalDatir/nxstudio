## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<label>` and `<input>`/`<textarea>` elements.

## 2025-08-13 - Missing ARIA Labels on Text-Character Icons
**Learning:** Text characters acting as icons (e.g., '✕' for closing modals/clearing searches) are common in this app but often lack explicit `aria-label`s, rendering them inaccessible to screen readers which will just announce "multiply" or unhelpful character names.
**Action:** Always verify that buttons containing only text-character icons (or any icon) include descriptive `aria-label` attributes to ensure they are accessible.
