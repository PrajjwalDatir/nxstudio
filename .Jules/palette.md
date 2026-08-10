## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<label>` and `<input>`/`<textarea>` elements.
## 2024-05-18 - Replacing text character icons with accessible SVGs
**Learning:** Found multiple instances where the "✕" text character was used for close buttons instead of standard SVG icons. This lacks explicit screen reader context (no aria-label) and creates minor visual inconsistencies compared to the rest of the application's icon set.
**Action:** When inspecting modals or dismissible panels, actively search for text-based icons (`✕`, `×`) and replace them with standard design system icons (e.g., `<XIcon />`) wrapped in an `aria-label` attribute to improve both screen reader experience and visual cohesion.
