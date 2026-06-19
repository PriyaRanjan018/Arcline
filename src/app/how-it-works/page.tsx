"use client";

import { useState } from "react";
import PageTransition from "@/components/shared/PageTransition";
import EntryCard from "@/components/shared/EntryCard";
import { cn } from "@/lib/utils";

const DEMO_ENTRY = {
  id: "demo",
  projectId: "My SaaS",
  builder: { username: "you", name: "You", initials: "YO", avatarBg: "bg-surface2" },
  type: "SETBACK",
  title: "Loss diverging after 10 epochs",
  content: "I can't figure out why the training loss spikes suddenly. Might need to rewrite the attention mechanism from scratch. Feeling stuck.",
  date: "Today",
  reactions: { feel: 0, keepGoing: 0, hitMe: 0, beenHere: 0 },
  reaction_count: 0,
};

const STEPS = [
  { id: 1, title: "Create a Project", desc: "Start by declaring what you're building. No need to wait until launch." },
  { id: 2, title: "Log Entries", desc: "Document wins, setbacks, milestones, and realizations as they happen." },
  { id: 3, title: "Map Momentum", desc: "Watch your journey map draw itself based on your honest progress." },
  { id: 4, title: "Build Portfolio", desc: "Your struggles prove your capability better than any polished resume." },
];

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <PageTransition className="flex flex-col md:flex-row min-h-[calc(100vh-48px)]">
      {/* Main Content */}
      <div className="flex-1 p-6 md:p-12 max-w-3xl">
        <h1 className="text-4xl font-display font-bold mb-12">How It Works</h1>
        
        <div className="space-y-6">
          {STEPS.map((step) => (
            <div 
              key={step.id} 
              className={cn(
                "border border-border bg-surface overflow-hidden transition-all duration-300",
                activeStep === step.id ? "ring-1 ring-accent" : "opacity-70 hover:opacity-100 cursor-pointer"
              )}
              onClick={() => setActiveStep(step.id)}
            >
              <div className="p-6 flex gap-4">
                <div className="text-xl font-mono text-accent">0{step.id}</div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-2">{step.title}</h3>
                  <p className="text-text2">{step.desc}</p>
                </div>
              </div>
              
              {activeStep === step.id && (
                <div className="bg-surface2 p-6 border-t border-border">
                  {/* Live Mockup Demo inside step */}
                  {step.id === 2 && (
                    <div className="scale-90 origin-top">
                      <EntryCard entry={DEMO_ENTRY} />
                    </div>
                  )}
                  {step.id !== 2 && (
                    <div className="h-32 border border-dashed border-border2 flex items-center justify-center text-text3 font-mono text-sm">
                      Interactive Mockup Area
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Stepper */}
      <div className="w-[320px] fixed right-0 top-[48px] bottom-0 bg-surface border-l border-border p-12 hidden lg:block">
        <div className="relative h-full flex flex-col justify-between py-12">
          {/* Connecting Line */}
          <div className="absolute left-[11px] top-12 bottom-12 w-[1px] bg-border2" />
          
          {STEPS.map((step) => (
            <div key={step.id} className="relative z-10 flex items-center gap-6 cursor-pointer" onClick={() => setActiveStep(step.id)}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center border transition-colors",
                activeStep >= step.id ? "bg-accent border-accent" : "bg-surface border-border2",
                activeStep === step.id && "ring-4 ring-accent/20"
              )}>
                {activeStep > step.id && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className={cn(
                "font-mono text-sm transition-colors",
                activeStep === step.id ? "text-accent font-bold" : "text-text3"
              )}>
                Step 0{step.id}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
