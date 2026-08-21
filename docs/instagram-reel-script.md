# Instagram Reel Text-Overlay Script

**Topic:** Setting up an Autonomous AI Agent with Model Context Protocol (MCP) and Local DeepSeek-R1 in Cursor AI
**Format:** Text-Overlay Script (High-Retention / "8-Step Descent into Chaos")
**Tone:** Deadpan, cynical, painfully relatable. No emojis in main script.

---

### **Title Card**
The unspoken pipeline of 'building an autonomous AI agent locally with MCP and Cursor in 5 minutes.'

---

### **Act 1: False Confidence**

* **Step 1:**
  Install Cursor AI, pull DeepSeek-R1 via Ollama, and clone the Model Context Protocol PostgreSQL server template. You are a sovereign 10x developer and cloud computing is officially dead.

* **Step 2:**
  Wire up Next.js 15, Tailwind v4, and Docker Compose with custom MCP tools. The agent seamlessly executes `npx tsx agent.ts` and plans its own refactoring.

* **Step 3:**
  Point the local agent at your production staging database with read-only scopes. Everything compiles cleanly, latency is 12ms, and you prepare to brag on X.

---

### **Act 2: The Cascading Meltdown**

* **Step 4:**
  The agent hits an infinite tool-calling loop during schema inspection. GPU VRAM spikes to 100%, Docker container hits `exit status 137 (OOM Killed)`, and local Ollama throws `POST http://localhost:11434/api/generate net::ERR_CONNECTION_REFUSED`.

* **Step 5:**
  Cursor AI freezes. MacBook fans sound like a jet engine taking off. Terminal outputs 4,000 lines of unhandled JSON-RPC protocol errors: `MCP error -32603: Internal error: context window exceeded (131072/131072 tokens)`.

* **Step 6:**
  Frantically spam `Ctrl + C` while Postman, Slack, and Chrome instantly crash. You smell hot silicon as your machine thermal throttles and drops to 2 frames per second.

---

### **Act 3: The Humiliating Hack**

* **Step 7:**
  You discover the local LLM hallucinated a recursive drop table command after mistaking a raw JSON schema response for system instructions.

* **Step 8:**
  Nuke Docker images, uninstall MCP config, copy-paste a 2,000-line monolithic prompt directly into ChatGPT Web UI, and manually run raw SQL queries in pgAdmin like it is 2012.

---

### **Call to Action**
Follow to survive AI agent development trauma.
