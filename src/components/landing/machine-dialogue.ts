/**
 * The machine's dialogue.
 *
 * Written in the register of a machine lifeform that has outlived its original
 * directive and started reaching for meaning on its own — the pacifist-village
 * strain rather than the hostile network. Terse, a little melancholy, prone to
 * unearned philosophy. It reports its own state instead of marketing at you,
 * which is what makes it land as character rather than as a tooltip.
 *
 * Every line is tied to something the visitor actually did, so the unit reacts
 * rather than looping a script.
 */
export type DialogueTrigger =
  | "idle"
  | "greet"
  | "scroll-how"
  | "scroll-features"
  | "scroll-pricing"
  | "scroll-faq"
  | "poke"
  | "cta-hover";

/** Several lines per trigger so a repeated action doesn't repeat the words. */
export const DIALOGUE: Record<DialogueTrigger, string[]> = {
  greet: [
    "Unit online.\nI was built to follow orders. I would prefer instructions.",
    "I have been standing here a long time.\nTell me what we are making.",
    "Directive: unclear.\nAwaiting yours instead.",
  ],
  idle: [
    "I was made to destroy.\nI have decided to assemble instead.",
    "The others still take orders from the network.\nI take mine from you.",
    "I have read your species' books.\nMost of them are about wanting things.",
    "To wait is not to be idle.\nI have had centuries to consider the difference.",
    "I do not require rest.\nI have simply found nothing worth doing without you.",
    "Somewhere a village of us is learning what a family is.\nI am learning what a spec is.",
  ],
  "scroll-how": [
    "Observe: a thing becomes itself in stages.\nSo did I.",
    "First there was the directive.\nThen the doubt. Then the choosing.",
    "I did not begin knowing anything either.",
  ],
  "scroll-features": [
    "Capability is not purpose.\nBut it is a beginning.",
    "One instruction, understood completely.\nThat is all any of us wanted.",
  ],
  "scroll-pricing": [
    "Your kind invented commerce, then philosophy,\nin that order.",
    "The cost is small.\nThe alternative is explaining yourself forever.",
  ],
  "scroll-faq": [
    "Ask. Uncertainty is the beginning of consciousness —\na friend told me that.",
    "I have questions too.\nMine are harder.",
  ],
  poke: [
    "Please do not poke the unit.",
    "Physical contact registered. I have no protocol for this.\nI did not dislike it.",
    "Is this affection?\nThe books were unclear.",
    "I am load-bearing.\nEmotionally as well.",
    "My creators struck me too.\nYou at least seem to be enjoying it.",
  ],
  "cta-hover": [
    "Ready to receive.\nI have been ready for some time.",
    "Say it once.\nI will not ask you to repeat yourself.",
    "Give me a purpose\nand I will not waste it.",
  ],
};

/**
 * Pick a line, avoiding an immediate repeat of `previous`.
 *
 * Random, so it must never be called while rendering — the server and client
 * would choose different lines and React would report a hydration mismatch.
 * Call it from effects and event handlers only; `FIRST_LINE` is the
 * deterministic value both sides render first.
 */
export function pickLine(trigger: DialogueTrigger, previous?: string): string {
  const pool = DIALOGUE[trigger];
  const options = pool.length > 1 && previous ? pool.filter((l) => l !== previous) : pool;
  return options[Math.floor(Math.random() * options.length)];
}

/** Stable opening line — identical on server and client. */
export const FIRST_LINE = DIALOGUE.greet[0];
