## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<label>` and `<input>`/`<textarea>` elements.

## 2024-05-24 - Missing ARIA Labels on Icon-only Action Buttons
**Learning:** Some heavily used components like the Sidebar use icon-only `<Button>` elements (e.g. for creating new projects when the sidebar is collapsed). Relying solely on the `title` attribute provides tooltip text on hover but isn't a robust accessible name for screen readers on all platforms/browsers.
**Action:** Always include an explicit `aria-label` attribute on icon-only buttons alongside the `title` attribute.
