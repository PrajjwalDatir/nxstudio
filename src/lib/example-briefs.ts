import type { IdeaData, TechStackInput } from "./types";
import type { BriefAnalysisResult } from "@/app/api/context/analyze-brief/route";

/**
 * Pre-generated Brief + AI analysis pairs, so a brand-new user can click once
 * and see the whole loop (idea, stack, pressure-test, data model, API surface)
 * without spending a real Gemini call or waiting on a round-trip. Content was
 * captured from real runs of /api/context/analyze-brief, not hand-written —
 * see the generation script this was captured with for reproducing/refreshing
 * these if the model or prompt changes materially.
 */
export interface ExampleBrief {
  id: string;
  label: string;
  idea: IdeaData;
  tech: TechStackInput;
  analysis: BriefAnalysisResult;
}

export const EXAMPLE_BRIEFS: ExampleBrief[] = [
  {
    id: "freelance-feedback",
    label: "Client feedback tool for freelance designers",
    idea: {
      problem:
        "Freelance designers waste hours every week manually chasing clients for feedback on drafts across scattered email threads and DMs.",
      targetUsers:
        "Freelance and small-agency designers who manage 3+ active client projects at once and need sign-off before moving to the next revision.",
      currentSolutions:
        "Email attachments and reply-all threads, screenshots pasted into Slack or WhatsApp DMs, or generic file-sharing tools like Dropbox that have no comment/approval flow.",
      differentiation:
        "One shareable link per draft with pinned, positional comments and a one-click approve — the client needs no account and no app to leave feedback.",
    },
    tech: { surfaces: ["web"], capabilities: ["auth", "database", "storage"] },
    analysis: {
      verdict: "promising",
      sharpenedProblem:
        "Freelance designers lose billable hours and project momentum due to fragmented, unversioned feedback loops across email and chat.",
      riskiestAssumptions: [
        "Clients will actually use a new link instead of just replying to the email they already have open.",
        "Designers are willing to pay for a tool that doesn't integrate directly into their existing design software (Figma/Adobe).",
        "The 'no-account' friction-less experience is technically viable without creating security/spam issues for the designer.",
      ],
      whoToInterview: [
        "Freelance designers managing 5+ concurrent clients.",
        "Small agency project managers who handle client communications.",
        "Clients of freelancers who frequently provide feedback on creative work.",
      ],
      stackConcerns: [
        "Missing real-time capability: Supabase Realtime is essential for 'pinned comments' to feel responsive; ensure it is explicitly enabled.",
        "Storage complexity: You need a robust strategy for handling high-res image versioning and CDN caching to ensure the 'shareable link' loads instantly for clients.",
      ],
      schema: {
        tables: [
          {
            name: "projects",
            purpose: "Groups multiple drafts under a single client engagement.",
            keyColumns: ["id", "designer_id", "client_name", "status"],
            relationships: ["has many drafts"],
          },
          {
            name: "drafts",
            purpose: "Stores specific versions of a design file for review.",
            keyColumns: ["id", "project_id", "file_url", "version_number", "status"],
            relationships: ["belongs to project", "has many comments"],
          },
          {
            name: "comments",
            purpose: "Captures positional feedback on specific draft versions.",
            keyColumns: ["id", "draft_id", "x_coord", "y_coord", "content", "author_name"],
            relationships: ["belongs to draft"],
          },
        ],
        endpoints: [
          { method: "POST", path: "/api/drafts", purpose: "Upload a new design draft for a project.", authRequired: true },
          { method: "GET", path: "/api/drafts/:id", purpose: "Fetch draft metadata and existing comments for the client view.", authRequired: false },
          { method: "POST", path: "/api/drafts/:id/comments", purpose: "Allow client to post a comment on a draft.", authRequired: false },
          { method: "PATCH", path: "/api/drafts/:id/approve", purpose: "Update draft status to approved.", authRequired: false },
        ],
      },
    },
  },
  {
    id: "habit-tracker",
    label: "Habit tracker for ADHD adults",
    idea: {
      problem:
        "Adults with ADHD start habit trackers constantly but abandon them within days because generic streak-based apps punish the very inconsistency that defines ADHD, causing shame spirals instead of progress.",
      targetUsers:
        "Adults recently diagnosed with ADHD, or self-identified, who have already tried and quit at least one habit or productivity app.",
      currentSolutions:
        "Generic habit trackers like Habitica or Streaks, plain to-do apps, or paper planners that get abandoned after a missed day breaks the streak.",
      differentiation:
        "No streaks to break — progress is shown as a rolling average and gentle re-entry nudges instead of guilt, designed with ADHD coaches, not gamification consultants.",
    },
    tech: { surfaces: ["ios", "android"], capabilities: ["auth", "database", "push", "ai"] },
    analysis: {
      verdict: "promising",
      sharpenedProblem:
        "Adults with ADHD abandon habit trackers because streak-based gamification triggers shame cycles; they need a low-friction, non-punitive system that prioritizes momentum over consistency.",
      riskiestAssumptions: [
        "Users will find value in rolling averages enough to replace the dopamine hit of a streak.",
        "The 'gentle re-entry' mechanism can be designed to be helpful rather than perceived as annoying 'nagging'.",
        "Users are willing to pay for a specialized tool when free generic alternatives are abundant.",
      ],
      whoToInterview: [
        "ADHD coaches currently struggling to recommend digital tools to clients.",
        "Users who have churned from at least three habit-tracking apps in the last six months.",
        "Adults with ADHD who use paper planners specifically to avoid digital 'guilt'.",
      ],
      stackConcerns: [
        "Supabase/Postgres is fine, but you need a robust client-side local-first strategy (e.g., WatermelonDB) because ADHD users will abandon the app if it lags or fails to load offline.",
        "The AI requirement is vague; ensure you aren't over-engineering with LLMs before validating if simple heuristic-based nudges suffice.",
      ],
      schema: {
        tables: [
          {
            name: "habits",
            purpose: "Stores user-defined habits and their specific tracking frequency.",
            keyColumns: ["id", "user_id", "title", "target_frequency"],
            relationships: ["belongs to users"],
          },
          {
            name: "completions",
            purpose: "Logs individual habit instances to calculate rolling averages.",
            keyColumns: ["id", "habit_id", "completed_at"],
            relationships: ["belongs to habits"],
          },
          {
            name: "profiles",
            purpose: "Stores user preferences for notification timing and nudge sensitivity.",
            keyColumns: ["id", "nudge_intensity", "timezone"],
            relationships: ["one-to-one with auth.users"],
          },
        ],
        endpoints: [
          { method: "POST", path: "/habits", purpose: "Create a new habit to track.", authRequired: true },
          { method: "POST", path: "/completions", purpose: "Log a habit completion for a specific date.", authRequired: true },
          { method: "GET", path: "/habits/stats", purpose: "Retrieve rolling average data for the user dashboard.", authRequired: true },
          { method: "PATCH", path: "/profiles/settings", purpose: "Update nudge frequency and notification preferences.", authRequired: true },
        ],
      },
    },
  },
  {
    id: "async-standup",
    label: "Async standups for remote eng teams",
    idea: {
      problem:
        "Remote engineering teams spread across time zones waste synchronous meeting time on standups that could be async, but existing async standup tools produce a wall of unread text nobody actually reads.",
      targetUsers:
        "Engineering managers and tech leads at remote-first companies with 8-40 person teams spread across 3+ time zones.",
      currentSolutions:
        "Slack threads that scroll away and get ignored, a synchronous daily call at an inconvenient time for half the team, or heavyweight tools like Geekbot that just collect answers without surfacing what matters.",
      differentiation:
        "Auto-summarizes everyone's update into a single 30-second daily digest highlighting blockers and cross-team dependencies, instead of just collecting raw answers.",
    },
    tech: { surfaces: ["web"], capabilities: ["auth", "database", "realtime", "ai"] },
    analysis: {
      verdict: "promising",
      sharpenedProblem:
        "Remote engineering teams struggle to extract actionable blockers from daily status updates, leading to meeting fatigue and ignored text-based reports.",
      riskiestAssumptions: [
        "Managers will trust an AI summary over raw data enough to stop holding daily syncs.",
        "Engineers will provide high-quality input that allows for meaningful dependency extraction.",
        "The friction of a new tool is lower than the pain of current Slack-based processes.",
      ],
      whoToInterview: [
        "Engineering Managers at 20+ person remote-first startups.",
        "Tech Leads who recently cancelled their daily standup.",
        "Individual contributors who feel 'standup fatigue'.",
      ],
      stackConcerns: [
        "The stack lacks an LLM orchestration layer (e.g., LangChain or Vercel AI SDK) to handle the summarization logic.",
        "Supabase Realtime is likely unnecessary for a daily digest; simple polling or cron-triggered notifications would suffice.",
      ],
      schema: {
        tables: [
          {
            name: "teams",
            purpose: "Groups of engineers sharing a standup cadence.",
            keyColumns: ["id", "name", "timezone_offset"],
            relationships: [],
          },
          {
            name: "updates",
            purpose: "Raw daily input from individual engineers.",
            keyColumns: ["id", "user_id", "team_id", "content", "created_at"],
            relationships: ["belongs to team", "belongs to user"],
          },
          {
            name: "summaries",
            purpose: "AI-generated digests for a specific team and date.",
            keyColumns: ["id", "team_id", "summary_text", "blockers_json", "date"],
            relationships: ["belongs to team"],
          },
        ],
        endpoints: [
          { method: "POST", path: "/api/updates", purpose: "Submit daily status update.", authRequired: true },
          { method: "GET", path: "/api/summaries", purpose: "Fetch the latest AI-generated digest for a team.", authRequired: true },
          { method: "POST", path: "/api/summaries/generate", purpose: "Trigger AI summarization for a specific team/date.", authRequired: true },
        ],
      },
    },
  },
];
