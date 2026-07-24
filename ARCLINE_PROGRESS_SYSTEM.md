# Arcline — Progress System Implementation Spec
**For: Google Gemini 3.1 Pro**
**Codebase:** Next.js 14 (App Router), TypeScript, Supabase, Framer Motion, Lucide React, Vanilla CSS (no Tailwind)
**Design language:** Dark, monospace-heavy, brutalist-minimal. No rounded corners on cards. Accent color: `#E8572A`. Background: `#080808`.

---

## CONTEXT — What Arcline Is

Arcline is a "proof-of-work for builders" platform. Builders create **projects**, then log **entries** (WIN | SETBACK | MILESTONE | REALIZATION) as they build. It is a journaling/showcase tool — NOT a productivity tracker. Builders come when they have something to log. There is no daily obligation.

**Key philosophy:** We celebrate the _journey_, not just the destination. Setbacks are not failures — they are data points.

---

## WHAT YOU ARE BUILDING

Six interconnected changes across the codebase:

1. **Progress Percentage** — Phase-based formula (not arbitrary ratio)
2. **Badge System** — Type-specific, Stage-based, and Time-based earned badges
3. **Remove Streak** — Delete all references to streak from the dashboard
4. **GitHub-style Heatmap** — Replace the old Journey Map visualization box
5. **Rename "Journey Map" tab → "Build Pulse"** on the project build log page
6. **New-Build Step 3 overhaul** — Replace stage-picking with first entry logging; default stage to `STARTED`

---

## FILE MAP (files you will touch)

```
src/
├── app/
│   ├── [username]/[project]/page.tsx   ← Main build log page — ADD tabs, heatmap, badges, progress
│   ├── new-build/page.tsx              ← Step 3 overhaul
│   └── api/
│       └── projects/route.ts           ← Change default stage to 'STARTED'
├── components/
│   └── shared/
│       ├── StageBadge.tsx              ← Already exists, no changes needed
│       ├── JourneyProgressBar.tsx      ← Already exists, used on build log — keep as-is
│       ├── BuildHeatmap.tsx            ← CREATE THIS
│       ├── ProgressRing.tsx            ← CREATE THIS (extracted from journey map)
│       └── BadgeCollection.tsx         ← CREATE THIS
└── lib/
    └── enums.ts                        ← Already has PROJECT_STAGES — no changes needed
```

---

## PART 1 — PROGRESS PERCENTAGE FORMULA

### Philosophy
Progress is **phase-based**, tied to the project's current `stage` field. Not entry ratios.

### Stage → Progress Mapping
```typescript
const STAGE_PROGRESS: Record<string, number> = {
  STARTED:      8,    // Just beginning, show a tiny sliver so the ring isn't empty
  BUILDING:     30,   // Active development — meaningful progress shown
  STRUGGLING:   35,   // Slightly ahead of BUILDING — struggle IS progress
  PIVOTING:     45,   // Pivoting means you survived enough to change direction
  BREAKTHROUGH: 70,   // Major leap
  LAUNCHED:     90,   // Shipped — almost there, room for post-launch growth
  PAUSED:       null, // Show last known progress, gray ring
  ABANDONED:    null, // Show last known progress, dark/muted ring
};
```

### Entry Bonus Points
On top of the stage base, add **entry bonus** (capped at +10 points total):
- Each MILESTONE logged: +2 points (capped at 3 milestones = +6)
- Each WIN logged: +0.5 points (capped at 8 wins = +4)
- REALIZATIONS and SETBACKS: no bonus, but they affect badge logic

```typescript
function calcProgress(stage: string, entries: Entry[]): number {
  const base = STAGE_PROGRESS[stage] ?? 30;
  const milestones = Math.min(entries.filter(e => e.type === 'MILESTONE').length, 3);
  const wins = Math.min(entries.filter(e => e.type === 'WIN').length, 8);
  const bonus = (milestones * 2) + (wins * 0.5);
  return Math.min(Math.round(base + bonus), 95); // Never 100% until explicitly LAUNCHED + 3+ milestones
}
```

### Special Cases
- If stage is `LAUNCHED` AND has 3+ milestones logged → show **100%**
- If stage is `PAUSED` or `ABANDONED` → show the ring grayed out with the computed %, add a label "Paused" or "Abandoned" below the ring

### Ring Color
- Default: `var(--accent)` = `#E8572A`  
- LAUNCHED: gradient from `#E8572A` to `#FFD700` (gold arc)
- PAUSED: `#444`
- ABANDONED: `#2a2a2a`

---

## PART 2 — BADGE SYSTEM

### Badge Data Structure
```typescript
interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;          // emoji or lucide icon name
  color: string;         // hex color for the badge border/glow
  category: 'stage' | 'type_specific' | 'time';
  earned: boolean;
  earnedAt?: string;     // ISO date string
}
```

### Badge Definitions (implement ALL of these)

#### 🔵 Type-Specific Badges
| Badge ID | Label | Icon | Condition | Color |
|---|---|---|---|---|
| `first_log` | First Log | `📝` | Logged 1st entry ever | `#7EB8F5` |
| `five_entries` | Proof of Work | `⚡` | 5 entries logged on this project | `#7EB8F5` |
| `twenty_five_entries` | Consistent Builder | `🔩` | 25 entries on this project | `#7EB8F5` |
| `survived_3_setbacks` | Scar Tissue | `🩹` | 3+ SETBACK entries logged | `#FF9800` |
| `rebound` | The Rebound | `↩️` | A WIN logged after 2+ consecutive SETBACKs | `#4CAF50` |
| `five_wins` | On A Roll | `🔥` | 5+ WIN entries | `#E8572A` |
| `deep_thinker` | Deep Thinker | `🧠` | 5+ REALIZATION entries | `#C9A96E` |
| `milestone_5` | Checkpoint Racer | `🏁` | 5 MILESTONE entries | `#7EB8F5` |

#### 🟠 Stage-Based Badges
| Badge ID | Label | Icon | Condition | Color |
|---|---|---|---|---|
| `launched` | Shipped 🚀 | `🚀` | Project stage = LAUNCHED | `#E8572A` |
| `breakthrough` | Breakthrough | `💡` | Stage reached BREAKTHROUGH | `#FFD700` |
| `survived_struggle` | Iron Will | `⚔️` | Stage was STRUGGLING, then moved to BUILDING or above | `#FF9800` |
| `pivoted` | Pivot King | `🔄` | Stage = PIVOTING or passed through it | `#C9A96E` |

#### ⏳ Time-Based Badges
| Badge ID | Label | Icon | Condition | Color |
|---|---|---|---|---|
| `week_one` | Week One | `🌱` | Project exists for 7+ days | `#4CAF50` |
| `month_one` | One Month Deep | `📅` | Project exists for 30+ days | `#4CAF50` |
| `three_months` | Quarter Builder | `🏛️` | Project exists for 90+ days | `#7EB8F5` |
| `six_months` | Half Year | `⏳` | Project exists for 180+ days | `#C9A96E` |
| `one_year` | Year One | `💎` | Project exists for 365+ days | `#FFD700` |

### Badge Computation (client-side, pure TypeScript)
```typescript
function computeBadges(project: Project, entries: Entry[]): Badge[] {
  const ageInDays = Math.floor((Date.now() - new Date(project.created_at).getTime()) / 86400000);
  const setbacks = entries.filter(e => e.type === 'SETBACK');
  const wins = entries.filter(e => e.type === 'WIN');
  const milestones = entries.filter(e => e.type === 'MILESTONE');
  const realizations = entries.filter(e => e.type === 'REALIZATION');
  
  // Check "rebound" — win after 2+ consecutive setbacks
  const hasRebound = checkRebound(entries);
  
  // Check "survived_struggle" — was STRUGGLING, now moved to BUILDING+
  const stageOrder = ['STARTED','BUILDING','STRUGGLING','PIVOTING','BREAKTHROUGH','LAUNCHED'];
  const survivedStruggle = project.stage !== 'STRUGGLING' && project.stage !== 'PAUSED' && project.stage !== 'ABANDONED';
  // Note: this is approximate — ideally track stage history in DB

  return [
    { id: 'first_log',            earned: entries.length >= 1 },
    { id: 'five_entries',         earned: entries.length >= 5 },
    { id: 'twenty_five_entries',  earned: entries.length >= 25 },
    { id: 'survived_3_setbacks',  earned: setbacks.length >= 3 },
    { id: 'rebound',              earned: hasRebound },
    { id: 'five_wins',            earned: wins.length >= 5 },
    { id: 'deep_thinker',         earned: realizations.length >= 5 },
    { id: 'milestone_5',          earned: milestones.length >= 5 },
    { id: 'launched',             earned: project.stage === 'LAUNCHED' },
    { id: 'breakthrough',         earned: ['BREAKTHROUGH','LAUNCHED'].includes(project.stage) },
    { id: 'survived_struggle',    earned: survivedStruggle && entries.some(e => e.type === 'SETBACK') },
    { id: 'pivoted',              earned: ['PIVOTING','BREAKTHROUGH','LAUNCHED'].includes(project.stage) },
    { id: 'week_one',             earned: ageInDays >= 7 },
    { id: 'month_one',            earned: ageInDays >= 30 },
    { id: 'three_months',         earned: ageInDays >= 90 },
    { id: 'six_months',           earned: ageInDays >= 180 },
    { id: 'one_year',             earned: ageInDays >= 365 },
  ].map(b => ({ ...BADGE_DEFINITIONS[b.id], ...b }));
}
```

### Badge UI Design Rules
- Show **earned badges** in full color with a subtle glow: `box-shadow: 0 0 12px {color}40`
- Show **unearned badges** as dark/gray ghost versions (opacity: 0.2, grayscale filter) — always visible so users know what they're working toward
- Display badges in a **horizontal scrollable row** (like achievement shelf)
- Each badge is a **square tile** (60×60px) with the emoji icon large (28px) centered, label below in 8px monospace
- On hover → scale 1.05, show a tooltip with the description and earned date (if earned)
- Group by category with a small label: `TYPE · STAGE · TIME`

---

## PART 3 — REMOVE STREAK

In `src/app/[username]/page.tsx` inside `JourneyMapTab`, delete the entire `<div className="flex items-center gap-4 mt-4 ...">` section that contains the Flame icon and "Streak: 6 Days" text.

Also remove imports: `Flame` from lucide-react if it's no longer used elsewhere.

---

## PART 4 — GITHUB HEATMAP (BuildHeatmap Component)

### Create: `src/components/shared/BuildHeatmap.tsx`

#### Data Structure
```typescript
interface HeatmapProps {
  entries: Array<{ created_at: string }>; // ISO date strings
}
```

#### Computation
1. Build a map of `date → count` from all entries' `created_at` dates
2. Generate the last 52 weeks (364 days) as an array of week arrays
3. Each day cell gets intensity level 0–4:
   - 0 = no entries (darkest/empty)
   - 1 = 1 entry
   - 2 = 2 entries  
   - 3 = 3 entries
   - 4 = 4+ entries (brightest)

#### Color Scale
Use Arcline accent to drive the intensity. All on dark background:
```
Level 0: #111111 (border: #1a1a1a)
Level 1: rgba(232, 87, 42, 0.20)
Level 2: rgba(232, 87, 42, 0.45)
Level 3: rgba(232, 87, 42, 0.70)
Level 4: rgba(232, 87, 42, 1.00) — full accent color
```

#### Layout
```
[Month labels: Jul Aug Sep Oct Nov Dec Jan Feb Mar Apr May Jun Jul]
[Day labels]  [52 × 7 grid of 11×11px squares, 2px gap]
              Mon
              Wed
              Fri
[Legend: Less ○ ○ ○ ○ ○ More — right aligned]
```

- Week columns flow left (oldest) to right (newest)  
- Today's cell gets a subtle `border: 1px solid #E8572A` to mark it
- Each cell on hover: tooltip showing `"Jul 12 — 3 entries"` (or "No entries")
- Tooltip built with CSS `title` attribute or a small absolutely-positioned div
- Months label shown above the grid at the start of each new month column
- Day-of-week labels (`Mon Wed Fri`) shown to the left

#### Responsive behavior
- On mobile: show last 26 weeks (half year) instead of 52
- Wrap in `overflow-x: auto` with `scrollbar: none` and a fade-right gradient mask

#### Summary line below heatmap
```
"47 entries logged this year  ·  Most active: October"
```
Compute "most active month" from the data.

---

## PART 5 — BUILD LOG PAGE OVERHAUL (`[username]/[project]/page.tsx`)

### Current structure (single-page scrolling layout):
```
← Back to profile
[Project Title]        [Stage Badge]
[Tagline]
[Journey Momentum % bar]
── Build Log ──
[Entry cards...]

Right sidebar:
  About this Build
  Started / Entries / Followers
  [Follow / Delete buttons]
```

### New Structure — Add Tabs
Convert the page to a tabbed layout. Tabs live in a sticky sub-header below the project title area.

```
← Back to profile
[Project Title]                              [Stage Badge]
[Tagline]

[Sticky Tab Bar]
  ┌─────────────┬──────────────┬──────────────────────────┐
  │  Build Log  │  Build Pulse │  (nothing else for now)  │
  └─────────────┴──────────────┴──────────────────────────┘

[Tab Content Area]
```

**Tab 1: "Build Log"** (default) — current entry list, unchanged  
**Tab 2: "Build Pulse"** — the new progress dashboard (replaces old Journey Map)

### Tab 2: Build Pulse Layout

Full-width, single column. Sections stack vertically:

```
┌─────────────────────────────────────────────────────┐
│  SECTION A: PROGRESS OVERVIEW                        │
│  ┌──────────────┬────────────────┬──────────────┐   │
│  │ [Ring: 45%]  │  Journey Stats │  Earned      │   │
│  │  Overall     │  WINS: 3       │  Badges: 4   │   │
│  │  Progress    │  SETBACKS: 2   │  [mini icons]│   │
│  │              │  MILESTONES: 1 │              │   │
│  │              │  REALIZ: 2     │              │   │
│  └──────────────┴────────────────┴──────────────┘   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  SECTION B: ACTIVITY HEATMAP                         │
│  LOGGED THIS YEAR                                    │
│  [52-week heatmap grid]                              │
│  47 entries this year · Most active: October         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  SECTION C: BADGE COLLECTION                         │
│  EARNED (4)           LOCKED (13)                    │
│  ┌───────────────────────────────────────────────┐  │
│  │ [Badge] [Badge] [Badge] [Badge] · · · [Ghost] │  │
│  └───────────────────────────────────────────────┘  │
│  Type ──────  Stage ──────  Time ──────              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  SECTION D: NEXT STEP CTA                            │
│  [Context-aware message based on stage/entries]      │
│  [LOG ENTRY ↗] button                                │
└─────────────────────────────────────────────────────┘
```

### Context-Aware Next Step Messages
```typescript
function getNextStep(stage: string, entries: Entry[]): string {
  if (entries.length === 0) return "Log your first entry. Document the starting point.";
  if (stage === 'LAUNCHED') return "You shipped. Now log what happened after launch.";
  if (stage === 'STRUGGLING') return "Struggling is data. Log what's blocking you.";
  if (stage === 'PIVOTING') return "What made you pivot? Log the realization.";
  const setbacks = entries.filter(e => e.type === 'SETBACK').length;
  const wins = entries.filter(e => e.type === 'WIN').length;
  if (setbacks > wins * 2) return "You've been through it. Time to log a WIN — find one.";
  return "Every day building requires proof of work. Document the details.";
}
```

### Stage Switcher (owner only)
In the right sidebar (or below the progress ring for owner), add a compact stage switcher:
```
CURRENT STAGE: [Building ▾]
```
Clicking opens a small dropdown/popover with all 8 stages as clickable options. On select, call `PATCH /api/projects/{id}` with `{ stage: newStage }`.

This replaces the manual aspect — the AI auto-detection is a future feature. For now, manual control is sufficient.

---

## PART 6 — NEW-BUILD STEP 3 OVERHAUL (`new-build/page.tsx`)

### What changes
- Step 3 no longer shows the stage picker grid
- Step 3 is now: **"Log your first entry"** — an inline mini-entry editor
- The project is created with `stage: 'STARTED'` hardcoded (no user input)
- After project creation, the first entry is also submitted via `POST /api/journal`

### Step 3 New UI
```
Step 3 of 3
"Kick it off with an entry"
"What's happening right now? This becomes your Day 1."

[Entry Type selector — 4 buttons: WIN | SETBACK | MILESTONE | REALIZATION]
  Default selected: REALIZATION

[Title input]
  Placeholder: "What's the situation right now?"

[Body textarea — 5 rows]
  Placeholder: "Describe where you are and what you're building..."

[Bottom actions]
  ← Back          [Create Project + Log Entry →]
```

### Submission flow
1. User clicks "Create Project + Log Entry"
2. POST `/api/projects` with `{ title, slug, tagline, description, category, stage: 'STARTED' }`
3. On success, get `projectData.id`
4. POST `/api/journal` with `{ project_id: projectData.id, type, title: entryTitle, entry_body: entryBody }`
5. On both success → show success screen, redirect to `/{username}/{slug}`

### API change in `src/app/api/projects/route.ts`
Change line 75:
```typescript
// BEFORE:
stage: stage || 'BUILDING',

// AFTER:
stage: stage || 'STARTED',
```

---

## COMPONENT SPECS

### `ProgressRing.tsx`
```typescript
interface ProgressRingProps {
  percent: number;      // 0–100
  stage: string;        // for color logic
  size?: number;        // default 112
  strokeWidth?: number; // default 6
}
```
- SVG-based, animated with Framer Motion `motion.circle`
- `initial={{ strokeDashoffset: circumference }}`
- `animate={{ strokeDashoffset: circumference * (1 - percent/100) }}`
- `transition={{ duration: 1.5, ease: "easeOut" }}`
- Center: large `{percent}%` in font-mono bold, small "PROGRESS" label below in text3

### `BuildHeatmap.tsx`
```typescript
interface BuildHeatmapProps {
  entries: Array<{ created_at: string }>;
}
```
Pure client component. No server calls — accepts raw entries array.

### `BadgeCollection.tsx`
```typescript
interface BadgeCollectionProps {
  project: { created_at: string; stage: string; };
  entries: Array<{ type: string; created_at: string }>;
  compact?: boolean; // if true, show max 5 earned badges as tiny icons
}
```

---

## DESIGN CONSTRAINTS

1. **No TailwindCSS** — use CSS classes already defined in globals.css + inline styles
2. **Font classes already available:** `font-display`, `font-mono`, `font-body`  
3. **CSS vars already available:** `--accent`, `--bg`, `--surface`, `--surface2`, `--border`, `--border-2`, `--text1`, `--text2`, `--text3`, `--win`, `--setback`, `--milestone`, `--realization`
4. **No border-radius** on cards — Arcline uses sharp corners throughout
5. **Framer Motion** is already installed — use it for all animations
6. **Lucide React** is already installed — use it for icons where emoji isn't used
7. All new sections should have `bg-surface border border-border` card treatment matching existing sections
8. Section headers should use: `text-[9px] font-mono uppercase tracking-widest text-text3`

---

## THINGS TO NOT CHANGE

- `JourneyProgressBar.tsx` — keep as-is, it's used on the build log page
- `EntryCard.tsx` — keep as-is
- `src/app/[username]/page.tsx` — the profile page Journey Map tab stays unchanged (it shows cross-project data)
- All authentication flows
- The `/api/journal` endpoint
- The `enums.ts` file

---

## EXECUTION ORDER

Implement in this order to avoid dependency issues:

1. Fix default stage in `api/projects/route.ts` (1 line change)
2. Build `ProgressRing.tsx` component
3. Build `BuildHeatmap.tsx` component  
4. Build `BadgeCollection.tsx` component
5. Overhaul `new-build/page.tsx` Step 3
6. Overhaul `[username]/[project]/page.tsx` — add tabs, wire up all three new components

---

## SUCCESS CRITERIA

- [ ] Clicking a project's "Open Build Log" shows a sticky tab bar with "Build Log" and "Build Pulse"
- [ ] "Build Pulse" tab shows: progress ring (phase-based %), heatmap, badges, next step CTA
- [ ] Progress % visually changes when stage changes
- [ ] Heatmap shows 52 weeks, darker = more entries that day
- [ ] Earned badges are colored/glowing, unearned are visible but ghosted
- [ ] Streak is completely removed from all views
- [ ] New-Build Step 3 asks for first entry log instead of stage picker
- [ ] Project is created with stage 'STARTED' by default
- [ ] Build compiles with `npm run build` without errors
