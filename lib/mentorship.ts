/**
 * Femtorship matching.
 *
 * A defender can be a mentor and a mentee at the same time. We pair a mentee's
 * "areas I need guidance in" against a mentor's "support I can provide", and
 * give a small boost when they share a county network. The same person is never
 * matched to themselves, and we never pair two people who only overlap as
 * mentees (or only as mentors).
 */

export interface MentorshipRow {
  user_id: string;
  county_network_id: string | null;
  is_mentor: boolean;
  is_mentee: boolean;
  guidance_areas: string[] | null; // what this person needs (mentee)
  support_offered: string[] | null; // what this person can give (mentor)
}

export interface Pairing {
  mentor_id: string;
  mentee_id: string;
  score: number;
  overlap: string[];
}

function overlapOf(a: string[] | null, b: string[] | null): string[] {
  const setB = new Set((b ?? []).map((s) => s.toLowerCase()));
  return (a ?? []).filter((s) => setB.has(s.toLowerCase()));
}

/**
 * Produce suggested pairings from every mentee to their best-fit mentors.
 * Returns at most `perMentee` suggestions for each mentee, sorted by score.
 */
export function computePairings(
  rows: MentorshipRow[],
  perMentee = 3,
): Pairing[] {
  const mentors = rows.filter((r) => r.is_mentor);
  const mentees = rows.filter((r) => r.is_mentee);
  const out: Pairing[] = [];

  for (const mentee of mentees) {
    const scored: Pairing[] = [];
    for (const mentor of mentors) {
      if (mentor.user_id === mentee.user_id) continue;
      const overlap = overlapOf(mentee.guidance_areas, mentor.support_offered);
      let score = overlap.length * 10;
      if (
        mentor.county_network_id &&
        mentor.county_network_id === mentee.county_network_id
      ) {
        score += 3; // same county network — easier to meet, shared context
      }
      if (score <= 0) continue;
      scored.push({
        mentor_id: mentor.user_id,
        mentee_id: mentee.user_id,
        score,
        overlap,
      });
    }
    scored.sort((a, b) => b.score - a.score);
    out.push(...scored.slice(0, perMentee));
  }

  return out;
}
