## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking. This is a common pattern in forms and dialogs in this app.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<\label>` and `<input>`/`<textarea>` elements, rather than relying exclusively on implicit nesting.
## 2023-10-24 - Missing ARIA Labels on Text-Character Icons
**Learning:** The app frequently uses plain text characters (like ✕) as UI icons (for closing modals, clearing inputs, etc.) instead of SVGs. These elements are not inherently descriptive to screen readers, leading to unannounced or confusing button behaviors.
**Action:** Always ensure that icon-only buttons, especially those using text characters, have explicit `aria-label` attributes to maintain accessibility.
