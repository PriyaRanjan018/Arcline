"use client";

import React, { useState, useEffect, useRef } from "react";
import PageTransition from "@/components/shared/PageTransition";
import Button from "@/components/shared/Button";
import CustomSelect from "@/components/shared/CustomSelect";
import { useAuth } from "@/contexts/AuthContext";
import { User, Shield, Bell, Check, Loader2, UploadCloud, AlertCircle, Globe, Link2, Download, Eye, EyeOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);

const AVAILABLE_TAGS = [
  "Software Engineer", "Frontend", "Backend", "Fullstack", "AI/ML", 
  "Mobile App", "UI/UX", "Product Manager", "Hardware", "Web3"
];

const BUILDER_ROLES = [
  "Indie Hacker", "Founder", "Developer", "Designer", "Product Builder",
  "Student", "Maker", "Engineer", "Researcher", "Creator"
];

const PRONOUNS_OPTIONS = ["He/Him", "She/Her", "They/Them", "He/They", "She/They", "Custom"];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => CURRENT_YEAR - i);

// Delete Account Modal Component
function DeleteAccountModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  isDeleting: boolean; 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#111111] border border-red-500/30 p-6 shadow-2xl flex flex-col gap-4">
        <h3 className="font-display font-bold text-xl text-red-500 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> Delete Account
        </h3>
        <div className="space-y-3 font-body text-sm text-[#888888]">
          <p>
            You are about to <span className="text-white font-medium">permanently delete</span> your Arcline account.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>All your build logs and entries will be permanently erased.</li>
            <li>Your public profile will be immediately deactivated.</li>
            <li>This action <span className="text-red-400 font-medium">cannot be undone</span>.</li>
          </ul>
        </div>
        <div className="flex gap-3 mt-4">
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 h-10 border border-[#333333] text-[#F2EDE4] font-body text-sm hover:bg-[#222222] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 h-10 bg-red-500/10 border border-red-500/30 text-red-500 font-body text-sm hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, delete my account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  // Settings sub-navigation tabs
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "notifications">("profile");

  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [builderRole, setBuilderRole] = useState("");
  const [currentlyBuilding, setCurrentlyBuilding] = useState("");
  // New profile fields
  const [pronouns, setPronouns] = useState("");
  const [customPronouns, setCustomPronouns] = useState("");
  const [buildingSince, setBuildingSince] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  // Privacy
  const [profilePublic, setProfilePublic] = useState(true);
  const [showEntryCount, setShowEntryCount] = useState(true);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailDigest, setEmailDigest] = useState(true);
  const [realtimeAlerts, setRealtimeAlerts] = useState(true);

  // Deletion States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasInitialized = useRef(false);

  // Sync profile data to local state
  useEffect(() => {
    if (profile && !hasInitialized.current) {
      setName(profile.name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setAvatarUrl(profile.avatar_url || "");
      setSelectedTags(profile.tags || []);
      setBuilderRole(profile.builder_role || "");
      setCurrentlyBuilding(profile.currently_building || "");
      setPronouns(profile.pronouns || "");
      setCustomPronouns(profile.custom_pronouns || "");
      setBuildingSince(profile.building_since ? String(profile.building_since) : "");
      setGithubUrl(profile.github_url || "");
      setTwitterUrl(profile.twitter_url || "");
      setWebsiteUrl(profile.website_url || "");
      setLinkedinUrl(profile.linkedin_url || "");
      setProfilePublic(profile.is_public !== false);
      setShowEntryCount(profile.show_entry_count !== false);
      hasInitialized.current = true;
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-48px)]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="p-16 text-center">
        <p className="text-text2">Please sign in to view settings.</p>
      </div>
    );
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setError("");
    
    try {
      const supabase = createClient();
      
      // 1. Call the secure RPC to delete the user
      const { error: rpcError } = await supabase.rpc('delete_user_account');
      
      if (rpcError) throw new Error(rpcError.message);
      
      // 2. Sign the user out locally
      await supabase.auth.signOut();
      
      // 3. Redirect to home page
      router.push("/");
      router.refresh();
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while deleting your account.");
      setShowDeleteModal(false);
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar image must be under 2MB");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to upload avatar");
      }

      setAvatarUrl(json.data.avatar_url);
      setSuccess("Avatar updated successfully! Refreshed in a moment.");
      // Refresh window/auth context to load updated details
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          bio,
          location,
          tags: selectedTags,
          builder_role: builderRole,
          currently_building: currentlyBuilding,
          pronouns: pronouns === "Custom" ? customPronouns : pronouns,
          building_since: buildingSince ? parseInt(buildingSince) : null,
          github_url: githubUrl,
          twitter_url: twitterUrl,
          website_url: websiteUrl,
          linkedin_url: linkedinUrl,
          avatar_url: null, // explicitly clear avatar
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to remove avatar");
      }

      setAvatarUrl("");
      setSuccess("Avatar removed successfully! Refreshed in a moment.");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An error occurred while removing avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          bio,
          location,
          tags: selectedTags,
          builder_role: builderRole,
          currently_building: currentlyBuilding,
          pronouns: pronouns === "Custom" ? customPronouns : pronouns,
          building_since: buildingSince ? parseInt(buildingSince) : null,
          github_url: githubUrl,
          twitter_url: twitterUrl,
          website_url: websiteUrl,
          linkedin_url: linkedinUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update profile");
      }

      await refreshProfile();
      setSuccess("Profile settings updated successfully!");
      // Optionally reload or sync
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };



  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <>
      <DeleteAccountModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleDeleteAccount}
        isDeleting={deletingAccount}
      />
      <PageTransition className="max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
        <div className="border-b border-border pb-4 mb-8">
          <h1 className="text-3xl font-display font-bold text-text1">Settings</h1>
          <p className="text-text2 text-sm mt-1">Manage your public profile and account preferences.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Navigation Sidebar */}
          <aside className="w-full md:w-[240px] flex-shrink-0 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 px-4 py-2 text-sm font-mono border text-left transition-colors ${
                activeTab === "profile"
                  ? "bg-accentDim border-accent text-text1"
                  : "border-transparent text-text3 hover:text-text2 hover:bg-white/5"
              }`}
            >
              <User className="w-4 h-4" />
              Public profile
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`flex items-center gap-3 px-4 py-2 text-sm font-mono border text-left transition-colors ${
                activeTab === "account"
                  ? "bg-accentDim border-accent text-text1"
                  : "border-transparent text-text3 hover:text-text2 hover:bg-white/5"
              }`}
            >
              <Shield className="w-4 h-4" />
              Account settings
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex items-center gap-3 px-4 py-2 text-sm font-mono border text-left transition-colors ${
                activeTab === "notifications"
                  ? "bg-accentDim border-accent text-text1"
                  : "border-transparent text-text3 hover:text-text2 hover:bg-white/5"
              }`}
            >
              <Bell className="w-4 h-4" />
              Notifications
            </button>
          </aside>

          {/* Settings Content Area */}
          <main className="flex-1 bg-surface border border-border p-6 md:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border-l-2 border-red-500 text-red-400 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-500/10 border-l-2 border-green-500 text-green-400 text-sm flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <h2 className="text-xl font-display font-bold border-b border-border2 pb-2 mb-4">Public profile</h2>

                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border2">
                  <div className="relative group">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-[80px] h-[80px] rounded-full object-cover border border-border2"
                      />
                    ) : (
                      <div className="w-[80px] h-[80px] rounded-full bg-[#E8572A] flex items-center justify-center font-body font-medium text-white text-3xl">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center sm:items-start gap-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            Upload picture
                          </>
                        )}
                      </Button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={uploading}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-text3 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-text3 mt-1">JPG, GIF or PNG. Max size of 2MB.</p>
                  </div>
                </div>

                {/* Name & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-2">Display Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-surface2 border border-border2 text-sm text-text1 rounded-none px-3 py-2 focus:outline-none focus:border-accent"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-2">Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-surface2 border border-border2 text-sm text-text1 rounded-none px-3 py-2 focus:outline-none focus:border-accent"
                      placeholder="janedoe"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-2">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-surface2 border border-border2 text-sm text-text1 rounded-none px-3 py-2 focus:outline-none focus:border-accent"
                    placeholder="San Francisco, CA (or Remote)"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full bg-surface2 border border-border2 text-sm text-text1 rounded-none px-3 py-2 focus:outline-none focus:border-accent font-body"
                    placeholder="Tell us about yourself, what you are building, or what excites you..."
                  />
                </div>

                {/* Tags (Skills / Interests) */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-3">Tags & Expertise</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1 font-mono text-[0.68rem] border transition-colors ${
                            isSelected
                              ? "bg-accent/15 border-accent text-accent"
                              : "bg-surface2 border-border2 text-text3 hover:text-text2 hover:border-border"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* I Am — Builder Identity */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-1">I Am</label>
                  <p className="text-xs text-text3 mb-3">Tell the world your builder identity — who you are and what you stand for.</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {BUILDER_ROLES.map((role) => {
                      const isSelected = builderRole === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setBuilderRole(isSelected ? "" : role)}
                          className={`px-3 py-1 font-mono text-[0.68rem] border transition-colors ${
                            isSelected
                              ? "bg-accent/15 border-accent text-accent"
                              : "bg-surface2 border-border2 text-text3 hover:text-text2 hover:border-border"
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>

                  <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-1 mt-4">Currently Building</label>
                  <p className="text-xs text-text3 mb-2">What's the one thing you're working on right now?</p>
                  <input
                    type="text"
                    value={currentlyBuilding}
                    onChange={(e) => setCurrentlyBuilding(e.target.value)}
                    placeholder="e.g. An AI tool for developers..."
                    maxLength={120}
                    className="w-full bg-surface2 border border-border2 text-sm text-text1 px-4 py-2.5 focus:outline-none focus:border-accent transition-colors placeholder:text-text3"
                  />
                  <div className="text-[10px] text-text3 font-mono mt-1 text-right">{currentlyBuilding.length}/120</div>
                </div>

                {/* Social Links */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-1">Social Links</label>
                  <p className="text-xs text-text3 mb-3">Your links appear on your public profile.</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <GithubIcon className="w-4 h-4 text-text3 flex-shrink-0" />
                      <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/yourname"
                        className="flex-1 bg-surface2 border border-border2 text-sm text-text1 px-3 py-2 focus:outline-none focus:border-accent transition-colors placeholder:text-text3" />
                    </div>
                    <div className="flex items-center gap-3">
                      <TwitterIcon className="w-4 h-4 text-text3 flex-shrink-0" />
                      <input type="url" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)}
                        placeholder="https://x.com/yourhandle"
                        className="flex-1 bg-surface2 border border-border2 text-sm text-text1 px-3 py-2 focus:outline-none focus:border-accent transition-colors placeholder:text-text3" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-text3 flex-shrink-0" />
                      <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="flex-1 bg-surface2 border border-border2 text-sm text-text1 px-3 py-2 focus:outline-none focus:border-accent transition-colors placeholder:text-text3" />
                    </div>
                    <div className="flex items-center gap-3">
                      <LinkedinIcon className="w-4 h-4 text-text3 flex-shrink-0" />
                      <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/yourname"
                        className="flex-1 bg-surface2 border border-border2 text-sm text-text1 px-3 py-2 focus:outline-none focus:border-accent transition-colors placeholder:text-text3" />
                    </div>
                  </div>
                </div>

                {/* Pronouns + Building Since */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-2">Pronouns</label>
                    <CustomSelect
                      value={pronouns}
                      onChange={setPronouns}
                      options={[
                        { value: "", label: "— Select —" },
                        ...PRONOUNS_OPTIONS.map(p => ({ value: p, label: p }))
                      ]}
                      className="w-full"
                    />
                    {pronouns === "Custom" && (
                      <input type="text" value={customPronouns} onChange={(e) => setCustomPronouns(e.target.value)}
                        placeholder="e.g. Ze/Hir"
                        className="w-full mt-2 bg-surface2 border border-border2 text-sm text-text1 px-3 py-2 focus:outline-none focus:border-accent" />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-2">Building Since</label>
                    <CustomSelect
                      value={buildingSince}
                      onChange={setBuildingSince}
                      placeholder="— Year —"
                      options={[
                        { value: "", label: "— Year —" },
                        ...YEAR_OPTIONS.map(y => ({ value: String(y), label: String(y) }))
                      ]}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border2 flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>) : "Save profile"}
                  </Button>
                </div>
              </form>
            )}

            {activeTab === "account" && (
              <div className="space-y-8">
                <h2 className="text-xl font-display font-bold border-b border-border2 pb-2">Account settings</h2>

                {/* Auth Info */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-text3 mb-2">Registered Email</label>
                  <p className="text-text1 font-mono text-sm bg-surface2 px-4 py-2 border border-border2 select-all inline-block">{user.email}</p>
                  <p className="text-xs text-text3 mt-1.5">Passwordless auth — sign in via magic link or OAuth. Your email is used for authentication and notifications.</p>
                </div>

                {/* Privacy Controls */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-1">Privacy Controls</label>
                  <p className="text-xs text-text3 mb-4">Control what others can see on your public profile.</p>
                  <div className="space-y-4 bg-surface2 border border-border2 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-text1 font-medium">Public Profile</p>
                        <p className="text-xs text-text3 mt-0.5">Anyone can view your profile and build logs.</p>
                      </div>
                      <button type="button" onClick={() => setProfilePublic(!profilePublic)}
                        className={cn("flex-shrink-0 flex items-center gap-2 px-3 py-1.5 border font-mono text-xs transition-colors",
                          profilePublic ? "border-accent bg-accent/10 text-accent" : "border-border2 text-text3 hover:border-border")}>
                        {profilePublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {profilePublic ? "Public" : "Private"}
                      </button>
                    </div>
                    <div className="h-[1px] bg-border2" />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-text1 font-medium">Show Entry Count</p>
                        <p className="text-xs text-text3 mt-0.5">Display total number of log entries on your profile.</p>
                      </div>
                      <button type="button" onClick={() => setShowEntryCount(!showEntryCount)}
                        className={cn("flex-shrink-0 w-4 h-4 border flex items-center justify-center transition-colors",
                          showEntryCount ? "border-accent bg-accent text-white" : "border-border2 bg-surface2 hover:border-border")}>
                        {showEntryCount && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button size="sm" onClick={() => { setSuccess("Privacy settings saved."); setTimeout(() => setSuccess(""), 3000); }}>Save privacy</Button>
                  </div>
                </div>

                {/* Export Data */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-text2 mb-1">Export My Data</label>
                  <p className="text-xs text-text3 mb-4">Download all your build logs and entries as a JSON file. Your data, always yours.</p>
                  <button type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/entries?limit=1000");
                        const json = await res.json();
                        const blob = new Blob([JSON.stringify(json.data ?? [], null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `arcline-export-${profile.username}-${new Date().toISOString().slice(0,10)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch { setError("Export failed. Please try again."); }
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-border2 text-text2 font-mono text-xs hover:border-accent hover:text-accent transition-colors">
                    <Download className="w-4 h-4" />
                    Download my data (.json)
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="pt-6 border-t border-red-500/20">
                  <h3 className="text-red-500 font-display font-bold text-sm uppercase tracking-wider mb-2">Danger Zone</h3>
                  <p className="text-xs text-text3 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 font-mono text-xs uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-xl font-display font-bold border-b border-border2 pb-2 mb-4">Notification preferences</h2>
                
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div 
                      onClick={() => setEmailDigest(!emailDigest)}
                      className={cn(
                        "w-4 h-4 border flex items-center justify-center mt-0.5 transition-colors",
                        emailDigest ? "border-accent bg-accent text-white" : "border-border2 bg-surface2 group-hover:border-border"
                      )}
                    >
                      {emailDigest && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div onClick={() => setEmailDigest(!emailDigest)}>
                      <span className="text-sm text-text1 block">Activity Email Digests</span>
                      <span className="text-xs text-text3">Weekly updates on bookmarks, views and follows for your builds.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div 
                      onClick={() => setRealtimeAlerts(!realtimeAlerts)}
                      className={cn(
                        "w-4 h-4 border flex items-center justify-center mt-0.5 transition-colors",
                        realtimeAlerts ? "border-accent bg-accent text-white" : "border-border2 bg-surface2 group-hover:border-border"
                      )}
                    >
                      {realtimeAlerts && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div onClick={() => setRealtimeAlerts(!realtimeAlerts)}>
                      <span className="text-sm text-text1 block">Real-time Reaction Alerts</span>
                      <span className="text-xs text-text3">Receive instantaneous browser / push notifications when builders react to your log entries.</span>
                    </div>
                  </label>
                </div>

                <div className="pt-4 border-t border-border2 flex justify-end">
                  <Button 
                    onClick={() => {
                      setSuccess("Notification preferences saved.");
                      setTimeout(() => setSuccess(""), 3000);
                    }}
                  >
                    Save preferences
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </PageTransition>
    </>
  );
}
