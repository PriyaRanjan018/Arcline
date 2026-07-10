"use client";

import { useState, useEffect } from "react";
import PageTransition from "@/components/shared/PageTransition";
import EntryCard from "@/components/shared/EntryCard";
import Link from "next/link";
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
  { id: 3, title: "Watch Your Arc", desc: "Watch your journey map draw itself based on your honest progress." },
  { id: 4, title: "Become Discoverable", desc: "Companies find builders through their build logs — not their resumes." },
];

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveStep(Number(entry.target.getAttribute("data-step")));
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    const elements = document.querySelectorAll(".step-container");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToStep = (id: number) => {
    const el = document.querySelector(`[data-step="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <PageTransition className="flex flex-col min-h-[calc(100vh-48px)] lg:pr-[320px]">
      {/* Main Content */}
      <div className="flex-1 p-6 md:p-12 max-w-3xl mx-auto pb-[50vh] w-full">
        <h1 className="text-4xl font-display font-bold mb-12 text-center lg:text-left">How It Works</h1>
        
        <div className="space-y-24">
          {STEPS.map((step) => (
            <div 
              key={step.id} 
              data-step={step.id}
              className={cn(
                "step-container border border-border bg-surface overflow-hidden transition-all duration-500",
                activeStep === step.id ? "ring-1 ring-accent opacity-100 scale-100 shadow-2xl shadow-accent/5" : "opacity-30 scale-[0.98] grayscale-[50%]"
              )}
            >
              <div className="p-8 flex gap-6">
                <div className="text-2xl font-mono text-accent mt-1">0{step.id}</div>
                <div>
                  <h3 className="text-2xl font-display font-bold mb-3">{step.title}</h3>
                  <p className="text-text2 text-lg">{step.desc}</p>
                </div>
              </div>
              
              <div className="bg-surface2 p-8 border-t border-border">
                {/* Live Mockup Demos inside steps */}
                {step.id === 1 && (
                  <div className="space-y-4 max-w-md mx-auto bg-surface border border-border p-6 shadow-xl">
                    <div className="text-sm font-mono text-text2 mb-4 uppercase tracking-widest">New Project</div>
                    <div className="space-y-2">
                      <div className="h-3 w-20 bg-border" />
                      <div className="h-10 w-full bg-bg border border-border2 flex items-center px-4">
                        <span className="text-text3 text-sm">e.g., Arcline Platform</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-32 bg-border" />
                      <div className="h-20 w-full bg-bg border border-border2 p-4">
                        <span className="text-text3 text-sm">What are you trying to solve?</span>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <div className="h-10 px-6 bg-accent flex items-center justify-center text-white font-medium text-sm cursor-pointer">
                        Declare Project
                      </div>
                    </div>
                  </div>
                )}
                {step.id === 2 && (
                  <div className="scale-95 origin-top">
                    <EntryCard entry={DEMO_ENTRY} />
                  </div>
                )}
                {step.id === 3 && (
                  <div className="max-w-md mx-auto p-6">
                    <div className="border-l-[2px] border-border2 ml-2 space-y-8">
                      <div className="relative pl-8">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-accent ring-4 ring-surface2" />
                        <div className="font-mono text-[10px] text-accent mb-1 uppercase tracking-wider">Day 14 &bull; Milestone</div>
                        <div className="text-lg font-medium text-text1">First 100 users acquired</div>
                      </div>
                      <div className="relative pl-8 opacity-70">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-border2 ring-4 ring-surface2" />
                        <div className="font-mono text-[10px] text-text3 mb-1 uppercase tracking-wider">Day 10 &bull; Pivot</div>
                        <div className="text-lg font-medium text-text2">Switched from MongoDB to Postgres</div>
                      </div>
                      <div className="relative pl-8 opacity-40">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-border2 ring-4 ring-surface2" />
                        <div className="font-mono text-[10px] text-text3 mb-1 uppercase tracking-wider">Day 1 &bull; Launch</div>
                        <div className="text-lg font-medium text-text2">Project Declared</div>
                      </div>
                    </div>
                  </div>
                )}
                {step.id === 4 && (
                  <div className="max-w-md mx-auto bg-surface border border-border p-6 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-accent flex items-center justify-center text-2xl font-display font-bold text-white">
                        YO
                      </div>
                      <div>
                        <h4 className="text-xl font-bold font-display text-text1">You</h4>
                        <div className="font-mono text-xs text-text3">@you &bull; Builder since 2023</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 border-t border-border2 pt-6">
                      <div>
                        <div className="text-3xl font-mono text-accent mb-1">42</div>
                        <div className="text-[10px] text-text3 uppercase tracking-widest">Entries</div>
                      </div>
                      <div>
                        <div className="text-3xl font-mono text-text1 mb-1">3</div>
                        <div className="text-[10px] text-text3 uppercase tracking-widest">Projects</div>
                      </div>
                      <div>
                        <div className="text-3xl font-mono text-text1 mb-1">12k</div>
                        <div className="text-[10px] text-text3 uppercase tracking-widest">Momentum</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Final CTA Section */}
        <div className="mt-32 text-center pb-12">
          <p className="text-xl md:text-2xl font-display font-medium text-text1 mb-8 max-w-2xl mx-auto leading-relaxed">
            "The best builders aren't the ones who never failed.<br/>
            <span className="text-text2">They're the ones who documented why they kept going.</span>"
          </p>
          <Link href="/login" className="inline-flex items-center justify-center px-8 py-4 bg-accent text-white font-body font-medium hover:bg-[#D14820] transition-colors">
            Start your build log &rarr;
          </Link>
        </div>
      </div>

      {/* Right Stepper */}
      <div className="w-[320px] fixed right-0 top-[48px] bottom-0 bg-surface border-l border-border p-12 hidden lg:block">
        <div className="relative h-full flex flex-col justify-between py-12">
          {/* Connecting Line */}
          <div className="absolute left-[11px] top-12 bottom-12 w-[1px] bg-border2" />
          
          {STEPS.map((step) => (
            <div 
              key={step.id} 
              className="relative z-10 flex items-center gap-6 cursor-pointer group" 
              onClick={() => scrollToStep(step.id)}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-300",
                activeStep >= step.id ? "bg-accent border-accent" : "bg-surface border-border2 group-hover:border-accent/50",
                activeStep === step.id && "ring-4 ring-accent/20 scale-110"
              )}>
                {activeStep > step.id && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className={cn(
                "font-mono text-sm transition-colors",
                activeStep === step.id ? "text-accent font-bold" : "text-text3 group-hover:text-text2"
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
