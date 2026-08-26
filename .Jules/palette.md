## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking. This is a common pattern in forms and dialogs in this app.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<\label>` and `<input>`/`<textarea>` elements, rather than relying exclusively on implicit nesting.

## 2026-08-26 - Missing Aria Labels on Text-Based Icons
**Learning:** The codebase frequently uses text characters (e.g., '✕') for UI icons rather than standard SVGs (which typically come with standard properties or are more obvious). These text character buttons act as icon-only buttons but were lacking explicit `aria-label` attributes, making them inaccessible to screen readers which might read them as a confusing symbol name or not read anything useful at all.
**Action:** When creating or maintaining icon-only buttons, especially those using simple text characters instead of standard icon components, explicitly add an `aria-label` attribute (e.g., `aria-label="Close"`) to ensure screen reader accessibility.
