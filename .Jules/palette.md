## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking. This is a common pattern in forms and dialogs in this app.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<\label>` and `<input>`/`<textarea>` elements, rather than relying exclusively on implicit nesting.

## 2024-05-25 - Explicit Labeling via useId
**Learning:** React 18's `useId` hook is a very clean and accessible way to generate unique IDs for dynamically rendered form fields.
**Action:** When making forms, always generate a unique ID to couple labels to inputs explicitly unless the input is the only child of the label.
## 2026-09-09 - Text Character Icons Require Explicit ARIA Labels
**Learning:** Many close buttons (e.g., modals, drawers) use text characters like '✕' instead of SVG icons. Without an explicit `aria-label`, screen readers announce this character in ways that lack context or intent, confusing users who rely on assistive technologies.
**Action:** Add `aria-label="Close"` (or context-appropriate label) to all buttons relying exclusively on text character icons to ensure screen reader accessibility.
