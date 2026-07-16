export const mockBuilders = [
  {
    username: "priya",
    name: "Priya Ranjan",
    initials: "PR",
    avatarBg: "bg-accent",
    bio: "Building tools for thought and proof-of-work platforms.",
    followers: 1204,
    following: 45,
  },
  {
    username: "meera",
    name: "Meera Patel",
    initials: "MP",
    avatarBg: "bg-win",
    bio: "Indie hacker. Shipping 12 apps in 12 months.",
    followers: 890,
    following: 120,
  },
  {
    username: "arjun",
    name: "Arjun K",
    initials: "AK",
    avatarBg: "bg-milestone",
    bio: "Design engineer exploring the intersection of brutalism and web3.",
    followers: 432,
    following: 89,
  },
  {
    username: "dev",
    name: "Dev Sharma",
    initials: "DS",
    avatarBg: "bg-setback",
    bio: "Failing forward. Building AI agents.",
    followers: 2100,
    following: 300,
  },
  {
    username: "riya",
    name: "Riya S",
    initials: "RS",
    avatarBg: "bg-realization",
    bio: "Full stack developer leaning into systems architecture.",
    followers: 156,
    following: 34,
  }
];

export const mockProjects = [
  {
    id: "arcline",
    builderId: "priya",
    name: "Arcline",
    description: "Proof of Work. NOT perfection. A proof-of-work platform for builders.",
    stage: "BUILDING",
    progress: 45,
    entriesCount: 12,
  },
  {
    id: "kalki",
    builderId: "priya",
    name: "Kalki Studios",
    description: "Premium digital experiences and branding for combat sports and dental clinics.",
    stage: "LAUNCHED",
    progress: 100,
    entriesCount: 24,
  },
  {
    id: "gpt",
    builderId: "priya",
    name: "GPT Model",
    description: "Custom transformer architecture trained from scratch.",
    stage: "STRUGGLING",
    progress: 30,
    entriesCount: 8,
  }
];

export const mockEntries = [
  {
    id: "e1",
    projectId: "arcline",
    builder: mockBuilders[0],
    type: "REALIZATION",
    title: "Ditching the generic profile grid",
    content: "Realized today that standard social media grids completely fail to tell a story. We need a timeline that maps to emotional momentum. The highs, the lows. We're going with a segmented SVG path.",
    date: "2h ago",
    reactions: { feel: 24, keepGoing: 12, hitMe: 5, beenHere: 8 }
  },
  {
    id: "e2",
    projectId: "gpt",
    builder: mockBuilders[0],
    type: "SETBACK",
    title: "Loss diverging after 10 epochs",
    content: "I can't figure out why the training loss spikes suddenly. I've checked the gradient clipping, reduced learning rate, but nothing works. Might need to rewrite the attention mechanism from scratch. Feeling completely stuck.",
    date: "1d ago",
    reactions: { feel: 8, keepGoing: 45, hitMe: 2, beenHere: 15 }
  },
  {
    id: "e3",
    projectId: "kalki",
    builder: mockBuilders[0],
    type: "WIN",
    title: "First client signed!",
    content: "Just closed the contract for the Lemon Royal project. They loved the brutalist/premium concept pitch.",
    date: "3d ago",
    reactions: { feel: 5, keepGoing: 10, hitMe: 0, beenHere: 0 }
  },
  {
    id: "e4",
    projectId: "app-1",
    builder: mockBuilders[1],
    type: "MILESTONE",
    title: "App 4/12 shipped",
    content: "Just submitted the 4th app to the App Store. The momentum is finally building up.",
    date: "4h ago",
    reactions: { feel: 12, keepGoing: 20, hitMe: 2, beenHere: 4 }
  },
  {
    id: "e5",
    projectId: "ai-agents",
    builder: mockBuilders[3],
    type: "SETBACK",
    title: "Context window limits hit hard",
    content: "Tried to pass an entire codebase into the prompt and everything crashed. We need a better chunking strategy. The naive approach just isn't scaling.",
    date: "5h ago",
    reactions: { feel: 45, keepGoing: 32, hitMe: 18, beenHere: 56 }
  }
];
