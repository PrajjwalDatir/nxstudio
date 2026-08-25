## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking. This is a common pattern in forms and dialogs in this app.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<\label>` and `<input>`/`<textarea>` elements, rather than relying exclusively on implicit nesting.

## 2024-08-25 - Text Character Icons
**Learning:** Found multiple instances where the codebase utilizes text characters (like '✕') for UI icons in buttons instead of standard SVGs. This creates a pattern where these icon-only buttons lack inherent accessibility context for screen readers.
**Action:** When working with buttons in this codebase, explicitly check for text-character icons and ensure they are accompanied by a descriptive `aria-label` attribute (e.g., `aria-label="Close"`) to guarantee screen reader accessibility.
