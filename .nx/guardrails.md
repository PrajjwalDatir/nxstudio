# NX GUARDRAILS

1. **Zero-Backend:** Do not use `fs` (File System) or Server Actions that require a database. All state must persist in `window.localStorage`.
2. **Visual Purity:** - Primary Accent: Lilac-500 (#A855F7).
   - Background: Zinc-950 (#09090B).
   - No Gradients unless subtle R3F fog.
3. **Performance:** - All 3D backgrounds must be wrapped in `Suspense` and allow generic HTML fallback.
   - Use `framer-motion` for micro-interactions, not heavy CSS keyframes.
4. **Strict Component Pattern:** - Use `shadcn/ui` for all interactive elements.
   - Do not write raw CSS classes if a Tailwind utility exists.
