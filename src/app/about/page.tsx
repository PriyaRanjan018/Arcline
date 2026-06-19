"use client";

import { useEffect, useState } from "react";
import PageTransition from "@/components/shared/PageTransition";

export default function AboutPage() {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -80% 0px" }
    );

    document.querySelectorAll("section[id]").forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const toc = [
    { id: "problem", label: "The Problem" },
    { id: "belief", label: "The Belief" },
    { id: "platform", label: "The Platform" },
    { id: "founder", label: "The Founder" },
  ];

  return (
    <PageTransition className="flex justify-center min-h-[calc(100vh-48px)] w-full">
      {/* Main Content Area */}
      <div className="w-full max-w-[720px] px-6 md:px-12 py-12 flex flex-col space-y-20 z-10 relative pb-32">
        {/* Header Section */}
        <header className="flex flex-col space-y-8" id="header">
          <div className="flex items-center space-x-4">
            <span className="font-mono text-[0.6rem] text-text3 tracking-wide uppercase">
              arcline <span className="text-accent mx-1">/</span> about
            </span>
            <span className="font-mono text-text2 border border-border px-[10px] py-[3px] text-[10px]">
              Founded · 2025 · Bhubaneswar, India
            </span>
          </div>
          <h1 className="font-display text-[3.2rem] md:text-[4rem] text-text1 leading-[1.1] font-black">
            We are tired <br />
            <span className="text-accent italic font-bold">of pretending.</span>
          </h1>
          <div className="pl-4 border-l-2 border-accent">
            <p className="font-body text-text2 font-light max-w-lg text-[0.9rem] leading-relaxed">
              The manifesto of Arcline — built on one belief: the real journey is more valuable than the highlight reel.
            </p>
          </div>
        </header>

        {/* 01 Problem */}
        <section className="flex flex-col space-y-6 pt-8 border-t border-border" id="problem">
          <span className="font-mono text-accent text-[0.6rem] tracking-widest uppercase">
            Section 01 / The Problem
          </span>
          <div className="relative bg-surface border border-border border-l-4 border-l-accent p-8 md:p-10 hover:-translate-y-[2px] transition-transform duration-300">
            <div className="absolute -top-5 left-2 text-[80px] font-display text-accent opacity-30 leading-none select-none">
              &ldquo;
            </div>
            <p className="relative z-10 font-display text-2xl font-bold italic text-text1">
              &quot;LinkedIn optimized for recruiters. It forgot about the builder.&quot;
            </p>
          </div>
          <div className="font-body text-text2 space-y-4 font-light text-[0.9rem] leading-relaxed">
            <p>
              We built tools for performance, tracking, and showcasing absolute success. We created platforms where people go to announce their victories to an audience of strangers. But we left no space for the work itself.
            </p>
          </div>
        </section>

        {/* 02 Belief */}
        <section className="flex flex-col space-y-6 pt-8 border-t border-border" id="belief">
          <span className="font-mono text-accent text-[0.6rem] tracking-widest uppercase">
            Section 02 / The Belief
          </span>
          <div className="relative bg-surface border border-border border-l-4 border-l-accent p-8 md:p-10 hover:-translate-y-[2px] transition-transform duration-300">
            <div className="absolute -top-5 left-2 text-[80px] font-display text-accent opacity-30 leading-none select-none">
              &ldquo;
            </div>
            <p className="relative z-10 font-display text-2xl font-bold italic text-text1">
              &quot;Your struggle is not your weakness. It is your signal.&quot;
            </p>
          </div>
        </section>

        {/* 03 Platform */}
        <section className="flex flex-col space-y-6 pt-8 border-t border-border" id="platform">
          <span className="font-mono text-accent text-[0.6rem] tracking-widest uppercase">
            Section 03 / The Platform
          </span>
          <div className="relative bg-surface border border-border border-l-4 border-l-accent p-8 md:p-10 hover:-translate-y-[2px] transition-transform duration-300">
            <div className="absolute -top-5 left-2 text-[80px] font-display text-accent opacity-30 leading-none select-none">
              &ldquo;
            </div>
            <p className="relative z-10 font-display text-2xl font-bold italic text-text1">
              &quot;Your journey is your portfolio. Not the polished version. The real one.&quot;
            </p>
          </div>
        </section>

        {/* Founder Note */}
        <section className="pt-12" id="founder">
          <div className="bg-surface border border-border border-l-4 border-l-gold p-8 hover:-translate-y-[2px] transition-transform duration-300">
            <span className="font-mono text-gold text-[0.58rem] tracking-widest uppercase block mb-6">
              A Note From The Founder
            </span>
            <div className="font-body text-text1 font-light text-[0.88rem] leading-[1.9] space-y-4">
              <p>
                I am 20 years old. I have spent the last few years trying to fit into boxes built by people who don&apos;t understand how builders actually work. We don&apos;t work in clean lines. We work in fragments, failures, late nights, and sudden realizations.
              </p>
              <p>I built Arcline because I needed it. Maybe you do too.</p>
            </div>
            <div className="mt-8 flex items-center space-x-4 pt-6 border-t border-border/50">
              <div className="w-12 h-12 rounded-[50%] overflow-hidden border border-border bg-surface2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Priya Ranjan Pradhan"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0vsKJw7hQg5lvRilqu2D5LlQv1w2ciFSlVGqNEZjago7xj9wk2smFP5XEBXbZHc85ag2FT2quaVbmVPjs4aUqn1oKk6sNo1IihLOXQ9m61wJ8YAyrXsA98tMTrbBiGDSQrtAZKTvpA3AZxv8DpYXQPCCCgaXtM6WRsQyZaHJ4oYCTZumj2WJeAQlMNfmZ3sH0oPriOM0kj9U-Sr5JSXTX2ud_c6S1itI72of7N64n6rFkNB3rQTanYhHSUePR5miN9NThlCKWmuI"
                  className="w-full h-full object-cover grayscale opacity-90"
                />
              </div>
              <div>
                <h4 className="font-display text-[1.1rem] italic text-text1">
                  Priya Ranjan Pradhan
                </h4>
                <p className="font-mono text-text2 mt-1 text-[10px] tracking-wider uppercase">
                  Founder, Arcline
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Right Panel (TOC) */}
      <aside className="hidden xl:block w-[280px] flex-shrink-0 border-l border-border bg-bg pt-12 pr-8 pl-8 relative">
        <div className="sticky top-[100px]">
          <h3 className="font-mono text-text3 tracking-widest text-[0.58rem] uppercase mb-6">
            On This Page
          </h3>
          <div className="relative">
            {/* Track */}
            <div className="absolute left-0 top-2 bottom-2 w-[1px] bg-border z-0"></div>
            <ul className="relative z-10 flex flex-col space-y-4">
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`block pl-4 font-body text-[0.82rem] transition-colors border-l-2 ${
                      activeSection === item.id
                        ? "text-text1 border-accent -ml-[1px]"
                        : "text-text2 hover:text-text1 border-transparent"
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </PageTransition>
  );
}
