## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<label>` and `<input>`/`<textarea>` elements.

## 2024-05-24 - Missing ARIA Labels on Text Character Icons
**Learning:** Found multiple instances where the "✕" character was used for close/clear buttons without an `aria-label`, rendering them inaccessible to screen readers. Relying solely on a text character that resembles an icon is an accessibility anti-pattern.
**Action:** Always add an explicit `aria-label` (e.g., `aria-label="Close"`) to icon-only buttons, especially those using text characters like "✕" instead of SVGs with embedded semantic information.
