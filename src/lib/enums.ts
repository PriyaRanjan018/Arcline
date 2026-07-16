/**
 * Canonical enum values — generated from Supabase schema.
 * Run: npx supabase gen types typescript --project-id <id>
 * to regenerate when the DB schema changes.
 *
 * All API route validation MUST use these constants.
 */

export const PROJECT_STAGES = [
  'STARTED',
  'BUILDING',
  'STRUGGLING',
  'PIVOTING',
  'BREAKTHROUGH',
  'LAUNCHED',
  'PAUSED',
  'ABANDONED',
] as const;
export type ProjectStage = typeof PROJECT_STAGES[number];

export const PROJECT_CATEGORIES = [
  'STARTUP',
  'COLLEGE_PROJECT',
  'PERSONAL_BUILD',
  'OPEN_SOURCE',
] as const;
export type ProjectCategory = typeof PROJECT_CATEGORIES[number];

export const ENTRY_TYPES = [
  'WIN',
  'SETBACK',
  'MILESTONE',
  'REALIZATION',
] as const;
export type EntryType = typeof ENTRY_TYPES[number];

export const REACTION_TYPES = [
  'FEEL_THIS',
  'KEEP_GOING',
  'HIT_ME',
  'BEEN_HERE',
] as const;
export type ReactionType = typeof REACTION_TYPES[number];
