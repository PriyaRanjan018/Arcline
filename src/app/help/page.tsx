"use client";

import React, { useState } from "react";
import PageTransition from "@/components/shared/PageTransition";
import Button from "@/components/shared/Button";
import { MessageSquare, AlertCircle, HelpCircle, ChevronDown, Check, Loader2 } from "lucide-react";

const FAQS = [
  {
    q: "How does Arcline measure my project's momentum?",
    a: "Momentum is a rolling weekly count calculated from your logs, updates, and milestone completions. Adding entries consistently keeps your momentum indicator high."
  },
  {
    q: "Can I import repositories directly from GitHub?",
    a: "Currently, Arcline focuses on user-submitted journal entries rather than commit history. We believe the story of the build is more telling than the code alone. Direct integrations are planned for future versions."
  },
  {
    q: "Who can see my build logs and project entries?",
    a: "All projects created on Arcline are public and visible in the Explore feed. You can share your direct profile URL with anyone as a real-time portfolio of your work."
  },
  {
    q: "How can I customize my profile details?",
    a: "Navigate to your settings from the user menu. You can customize your name, bio, target locations, tags of expertise, and toggle what opportunities you are open to."
  }
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Feedback form state
  const [category, setCategory] = useState("question");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Simulate API submit delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitted(true);
      setSubject("");
      setMessage("");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition className="max-w-4xl mx-auto w-full px-4 md:px-8 py-8 min-h-[calc(100vh-48px)]">
      <div className="border-b border-border pb-6 mb-8">
        <h1 className="text-3xl font-display font-bold text-text1 flex items-center gap-2">
          <HelpCircle className="w-8 h-8 text-accent" />
          Help & Support
        </h1>
        <p className="text-text2 text-sm mt-1">Get assistance, view FAQs, or submit feedback to improve the platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Side: FAQs */}
        <div>
          <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
            <span>Frequently Asked Questions</span>
          </h2>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="bg-surface border border-border">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left transition-colors hover:bg-white/[0.02]"
                  >
                    <span className="font-display font-medium text-sm text-text1">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-text3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 border-t border-border/50 pt-3 text-xs text-text2 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Contact / Feedback Form */}
        <div>
          <div className="bg-surface border border-border p-6">
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              <span>Submit Feedback</span>
            </h2>
            <p className="text-xs text-text3 mb-6">
              Found a bug? Have a suggestion? Drop us a note and we will check it out.
            </p>

            {submitted ? (
              <div className="p-4 bg-green-500/10 border-l-2 border-green-500 text-green-400 text-sm flex items-start gap-2 mb-4">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Feedback Sent!</p>
                  <p className="text-xs text-green-400/80 mt-1">Thank you for helping us improve Arcline. We appreciate it!</p>
                  <button onClick={() => setSubmitted(false)} className="text-xs underline text-green-400 hover:text-white mt-3 block">
                    Submit another response
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border-l-2 border-red-500 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-surface2 border border-border2 text-sm text-text1 rounded-none px-3 py-2 focus:outline-none focus:border-accent"
                  >
                    <option value="question">General Question</option>
                    <option value="bug">Report a Bug</option>
                    <option value="feature">Feature Request</option>
                    <option value="feedback">General Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-1.5">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-surface2 border border-border2 text-sm text-text1 rounded-none px-3 py-2 focus:outline-none focus:border-accent"
                    placeholder="e.g. Broken links in notifications"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-1.5">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-surface2 border border-border2 text-sm text-text1 rounded-none px-3 py-2 focus:outline-none focus:border-accent font-body"
                    placeholder="Describe your issue or suggestion in detail..."
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Response"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
