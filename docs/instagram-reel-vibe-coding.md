# Instagram Reel Script: The 8-Step Descent into Chaos

**Topic:** Vibe Coding Full-Stack Apps with Cursor AI & Claude 3.5 Sonnet

---

### Title Overlay
The unspoken pipeline of 'vibe coding a full-stack SaaS MVP in 3 hours without reading a single line of code.'

---

### Act 1: False Confidence

**Step 1**
You open Cursor AI, accept a 14-day trial of Claude 3.5 Sonnet, and type `npx create-next-app@latest --typescript --tailwind --app` while telling yourself software engineering is officially solved.

**Step 2**
You hit `Cmd+K` and prompt: "Build a real-time collaborative whiteboard using Next.js 15 Server Actions, Supabase Auth, Prisma ORM, and WebSockets." Cursor generates 42 clean files in 18 seconds.

**Step 3**
You blindly spam `Cmd+I` to accept every file change without reviewing diffs. The dev server compiles with 0 errors. You update your LinkedIn headline to "AI Native Founder & 10x Architect."

---

### Act 2: The Cascading Meltdown

**Step 4**
You test user signup, but the form silently hangs while the terminal logs `Unhandled Runtime Error: Hydration failed because the initial UI does not match what was rendered on the server.`

**Step 5**
You tell Cursor "fix hydration error", and it rewrites your entire root layout, replacing Server Components with `use client`, breaking Supabase cookie sessions with `ERR_TOO_MANY_REDIRECTS`.

**Step 6**
Cursor enters an automated refactor loop, deleting your database schema migrations, spawning 14 dangling Node processes, and throwing `TypeError: Cannot read properties of null (reading 'user')` while Next.js hits `Memory limit exceeded (OOMKilled)`.

---

### Act 3: The Humiliating Hack

**Step 7**
You abandon Prisma, delete Supabase Auth middleware, and replace state management with a single global `window.appData` object containing unhashed passwords in `localStorage`.

**Step 8**
You add `useEffect(() => { window.location.reload() }, 3000)` to sweep hydration bugs under the rug, push straight to production main, and log off before clients notice.

---

### Call to Action
Follow to survive vibe coding & AI developer workflow trauma.
