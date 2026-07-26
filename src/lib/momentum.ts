export const JMS_BASE: Record<string, number> = {
  MILESTONE:   15,
  SETBACK:     12,
  WIN:         10,
  REALIZATION:  8,
};

export const JMS_BENCHMARK = 300;

export function getRecencyMultiplier(createdAt: string): number {
  const diffMs   = Date.now() - new Date(createdAt).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <  1) return 2.0;
  if (diffDays <  7) return 1.5;
  if (diffDays < 30) return 1.2;
  return 1.0;
}

export function calcStreakDays(entries: { created_at: string }[]): number {
  if (entries.length === 0) return 0;
  const entryDays = new Set(
    entries.map(e => {
      const d = new Date(e.created_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const check = new Date(today);
    check.setDate(today.getDate() - i);
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
    if (entryDays.has(key)) streak++;
    else break;
  }
  return streak;
}

export interface JMSResult {
  percent:          number;
  score:            number;
  momentumPoints:   number;
  rawScore:         number;
  streakDays:       number;
  streakMultiplier: number;
  diversityBonus:   number;
  projectBonus:     number;
  uniqueProjects:   number;
  wins:             number;
  setbacks:         number;
  milestones:       number;
  realizations:     number;
  state:            string;
  stateColour:      string;
}

export function calcMomentum(
  entries: { type?: string; created_at: string; projectId?: string; project_id?: string }[]
): JMSResult {
  const wins        = entries.filter(e => e.type === "WIN").length;
  const setbacks    = entries.filter(e => e.type === "SETBACK").length;
  const milestones  = entries.filter(e => e.type === "MILESTONE").length;
  const realizations = entries.filter(e => e.type === "REALIZATION").length;

  let rawScore = 0;
  for (const entry of entries) {
    const base    = JMS_BASE[entry.type ?? ""] ?? 8;
    const recency = getRecencyMultiplier(entry.created_at);
    rawScore += base * recency;
  }

  const streakDays       = calcStreakDays(entries);
  const streakMultiplier = Math.min(2.0, 1.0 + streakDays * 0.02);

  const typesPosted   = [wins > 0, setbacks > 0, milestones > 0, realizations > 0].filter(Boolean).length;
  const diversityBonus = typesPosted === 4 ? 1.25
                       : typesPosted === 3 ? 1.10
                       : typesPosted === 2 ? 1.05
                       : 1.00;

  const uniqueProjects = new Set(
    entries.map(e => e.projectId || e.project_id).filter(Boolean)
  ).size || 1;
  const projectBonus = Math.min(1.25, 1.0 + (uniqueProjects - 1) * 0.05);

  const momentumPoints = rawScore * streakMultiplier * diversityBonus * projectBonus;
  let percent = Math.min(100, (momentumPoints / JMS_BENCHMARK) * 100);
  percent = Math.max(5, percent);
  percent = Math.round(percent * 10) / 10;

  let state: string;
  let stateColour: string;
  if      (percent <= 15) { state = "Just Started"; stateColour = "#555555"; }
  else if (percent <= 30) { state = "Warming Up";   stateColour = "#FF9800"; }
  else if (percent <= 50) { state = "Building";     stateColour = "#7EB8F5"; }
  else if (percent <= 70) { state = "Momentum";     stateColour = "#C9A96E"; }
  else if (percent <= 90) { state = "On Fire";      stateColour = "#E8572A"; }
  else                    { state = "Peak Builder"; stateColour = "#4CAF50"; }

  return {
    percent,
    score:            Math.round(percent),
    momentumPoints:   Math.round(momentumPoints * 10) / 10,
    rawScore:         Math.round(rawScore * 10) / 10,
    streakDays,
    streakMultiplier: Math.round(streakMultiplier * 100) / 100,
    diversityBonus,
    projectBonus:     Math.round(projectBonus * 100) / 100,
    uniqueProjects,
    wins, setbacks, milestones, realizations,
    state, stateColour,
  };
}
