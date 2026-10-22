/**
 * Typed decisions from TypeSafe's Jev (System One). Give it some text and a
 * question with a fixed set of answers; it returns one of them with
 * probabilities, in a single fast pass and without writing prose. The right tool
 * for "which of these is it" and "yes or no". The wrong one for writing,
 * arithmetic or counting.
 *
 * Jev only. There is deliberately no OpenRouter fallback: when the key is
 * missing or Jev does not answer, every function returns null and the caller
 * keeps using its own rule. Nothing here may be required for a page to work.
 *
 * Privacy: text sent here leaves our servers. Public posts from social media are
 * fine. A reporter's private report is not, and is only ever sent when
 * JEV_PRIVATE_REPORTS=on has been set on purpose (see jevMayReadReports).
 */

export interface Choice<K extends string> {
  choice: K;
  probability: number;
  confidence: number;
  probabilities: Record<string, number>;
}

const jevKey = () => process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY || "";

/** True when Jev can be asked anything at all. */
export const decideConfigured = () => !!jevKey();

/** Private reports are sent to Jev only on an explicit, deliberate opt-in. */
export const jevMayReadReports = () => decideConfigured() && (process.env.JEV_PRIVATE_REPORTS ?? "").toLowerCase() === "on";

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";

interface Answer { choice: string; probabilities: Record<string, number>; confidence: number }

async function ask(state: string, instructions: string, criteria: Record<string, string>): Promise<Answer | null> {
  const key = jevKey();
  if (!key) return null;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      signal: AbortSignal.timeout(8_000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.JEV_MODEL_DIRECT || "jev-latest",
        state: state.slice(0, 24_000),
        questions: { q: { type: "choice", instructions, criteria } },
      }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { answers?: { q?: { choice?: string; probabilities?: Record<string, number>; confidence?: number } } };
    const a = j.answers?.q;
    if (!a?.choice || !(a.choice in criteria)) return null;
    return { choice: a.choice, probabilities: a.probabilities ?? {}, confidence: a.confidence ?? a.probabilities?.[a.choice] ?? 0 };
  } catch {
    return null;
  }
}

/** Pick one of the given answers. Null when Jev is not configured or did not answer. */
export async function decideChoice<K extends string>(
  state: string,
  instructions: string,
  options: Record<K, string>,
): Promise<Choice<K> | null> {
  const r = await ask(state, instructions, options);
  if (!r || !(r.choice in options)) return null;
  return { choice: r.choice as K, probability: r.probabilities[r.choice] ?? r.confidence, confidence: r.confidence, probabilities: r.probabilities };
}

/** Yes or no, with a probability for yes. */
export async function decideYesNo(
  state: string,
  question: string,
  yes: string,
  no: string,
): Promise<{ yes: boolean; probability: number } | null> {
  const r = await decideChoice(state, question, { yes, no });
  if (!r) return null;
  const p = r.probabilities.yes ?? (r.choice === "yes" ? r.probability : 1 - r.probability);
  return { yes: r.choice === "yes", probability: p };
}
