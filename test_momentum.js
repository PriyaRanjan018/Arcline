const now = new Date();
const msDay = 1000 * 60 * 60 * 24;
const today = new Date(now.getTime() - msDay * 0.5).toISOString();
const thisWeek = new Date(now.getTime() - msDay * 3).toISOString();
const lastMonth = new Date(now.getTime() - msDay * 15).toISOString(); // 15 days is "this month" in our code (8-30d)

const entries = [
  { type: 'MILESTONE', created_at: today, project_id: '1' },
  { type: 'WIN', created_at: thisWeek, project_id: '1' },
  { type: 'WIN', created_at: thisWeek, project_id: '1' },
  { type: 'SETBACK', created_at: thisWeek, project_id: '1' },
  { type: 'REALIZATION', created_at: lastMonth, project_id: '1' }
];

let rawScore = 0;
entries.forEach(entry => {
  let basePoints = 0;
  if (entry.type === 'MILESTONE') basePoints = 15;
  else if (entry.type === 'SETBACK') basePoints = 12;
  else if (entry.type === 'WIN') basePoints = 10;
  else if (entry.type === 'REALIZATION') basePoints = 8;

  const diffTime = Math.abs(now.getTime() - new Date(entry.created_at).getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let recencyMultiplier = 1.0;
  if (diffDays <= 1) recencyMultiplier = 2.0;
  else if (diffDays <= 7) recencyMultiplier = 1.5;
  else if (diffDays <= 30) recencyMultiplier = 1.2;
  
  rawScore += (basePoints * recencyMultiplier);
});

console.log("Raw Score:", rawScore);
const streakDays = 6;
const streakMultiplier = 1.0 + (streakDays * 0.02);
console.log("Streak Multiplier:", streakMultiplier);
const diversityBonus = 1.25;
const projectBonus = 1.0;
const momentumPoints = rawScore * streakMultiplier * diversityBonus * projectBonus;
console.log("Momentum Points:", momentumPoints);
const jmsPercent = (momentumPoints / 300) * 100;
console.log("JMS Percent:", jmsPercent);
