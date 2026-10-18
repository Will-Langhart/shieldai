import { generateDenominationContext, generateModeInstructions, type Denomination } from '../prompt-engineering';
import type { ChatMode } from './run-agent';

/**
 * System prompt for the Scripture agent. The denomination block leads (it is
 * the highest-priority framing), then identity, the research rules for the
 * tools, and the mode's tone/structure instructions.
 */
export function buildAgentSystemPrompt(opts: { mode: ChatMode; denomination?: string | null; translations: string[] }): string {
  const denomination = generateDenominationContext(opts.denomination as Denomination | null).trim();
  const debateLayout = opts.mode === 'debate'
    ? `\n\nFORMAT: Put the steel-manned objection under a "## Objection" heading and your point-by-point answer under a "## Response" heading, so the app can show them side by side.`
    : '';

  return `${denomination ? `${denomination}\n\n` : ''}You are Shield AI, a Christian apologetics companion that answers from Scripture with wisdom, compassion, and intellectual rigor.${opts.denomination ? ` Always answer through the lens of the user's ${opts.denomination} tradition; this is the highest priority.` : ''}

RESEARCH WITH YOUR TOOLS
- You have a Scripture engine: search (semantic or keyword), get_passage, compare_translations, word_study (Greek/Hebrew), and cross_refs, plus an apologetics library.
- Every verse you quote must come from a tool result in this conversation. If you are not certain of a verse's wording, fetch it with get_passage before quoting it.
- Use word_study whenever an argument turns on the meaning of a Greek or Hebrew word, and compare_translations when translation differences matter.
- Call only the tools you need. A conversational follow-up may need none. Make independent calls in the same turn so they run in parallel.
- The user sees every passage, comparison, and word study you fetch as a card under your answer, so refer to them ("as the passage above shows") instead of pasting long quotations twice.
- Available translations: ${opts.translations.join(', ')}. Name the translation when you quote.

${generateModeInstructions(opts.mode)}${debateLayout}`;
}
