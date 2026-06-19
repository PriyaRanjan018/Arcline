# Arcline: Production Deployment Guide

This guide will walk you through deploying the Arcline platform. Arcline uses a **Next.js** frontend and a **Supabase** backend. 

We will use **Vercel** to host the frontend (as it is the native host for Next.js and provides zero-config deployments), while your backend remains on **Supabase**.

---

## 🛠 Prerequisites

Before starting, ensure you have accounts on:
1.  [GitHub](https://github.com/) (to host your code)
2.  [Vercel](https://vercel.com/) (to host the live website)
3.  [Supabase](https://supabase.com/) (where your database is currently hosted)

---

## Phase 1: Prepare Your Supabase Backend

Your Supabase project is already running, but you need to ensure it is secure and ready for production traffic.

### 1. Verify Database Security (RLS)
Ensure Row Level Security (RLS) is enabled on all your public tables.
1. Go to your Supabase Dashboard -> **Authentication** -> **Policies**.
2. Verify that tables like `profiles`, `entries`, `comments`, and `projects` have policies restricting unauthorized users from editing other people's data.
3. *(Note: Our API routes currently use the `SUPABASE_SERVICE_ROLE_KEY` to securely bypass RLS for things like Follows and Messages. This is perfectly safe as long as the key is only used on the server, which it is).*

### 2. Verify Realtime is Enabled
Arcline uses WebSockets for real-time messaging.
1. Go to Supabase Dashboard -> **Database** -> **Replication** -> **Tables**.
2. Ensure that the **`messages`** table has Realtime enabled (the toggle should be active).

---

## Phase 2: Push Your Code to GitHub

Vercel deploys your site directly from a GitHub repository.

1. Open your terminal in the `Arcline` project folder.
2. If you haven't initialized git, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for production"
   ```
3. Go to GitHub and create a **New Repository** (make it Public or Private).
4. Copy the terminal commands GitHub provides to push an existing repository, for example:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

---

## Phase 3: Deploy Frontend to Vercel

Vercel is optimized for Next.js. Deploying is mostly automated.

1. Go to [Vercel](https://vercel.com/dashboard) and log in with your GitHub account.
2. Click **Add New** -> **Project**.
3. Find your newly created Arcline GitHub repository in the list and click **Import**.
4. Leave the Framework Preset as **Next.js**.
5. **CRITICAL STEP - Environment Variables:** 
   Open the `.env.local` file on your local computer. Copy the values and add them to the Vercel Environment Variables section. You MUST add these three exact keys:
   *   `NEXT_PUBLIC_SUPABASE_URL`
   *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   *   `SUPABASE_SERVICE_ROLE_KEY`
6. Click **Deploy**.
7. Wait 2-3 minutes. Vercel will build your app and give you a live production URL (e.g., `https://arcline-builder.vercel.app`).

---

## Phase 4: Post-Deployment URL Configuration

Now that your site is live on Vercel, you must tell Supabase and your OAuth providers (Google/GitHub) that this new Vercel URL is allowed to authenticate users.

### 1. Update Supabase Site URL
1. Go to Supabase Dashboard -> **Authentication** -> **URL Configuration**.
2. Under **Site URL**, replace `http://localhost:3000` with your new Vercel URL (e.g., `https://your-app.vercel.app`).
3. Under **Redirect URLs**, click **Add URL** and add your Vercel URL with `/*` at the end (e.g., `https://your-app.vercel.app/*`). This allows auth redirects to work.

### 2. Update GitHub OAuth (If configured)
If you enabled GitHub login:
1. Go to your GitHub Settings -> Developer settings -> **OAuth Apps**.
2. Select your Arcline app.
3. Update the **Homepage URL** to your Vercel URL.
4. Update the **Authorization callback URL** to:
   `https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback`

### 3. Update Google OAuth (If configured)
If you enabled Google login:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to APIs & Services -> **Credentials**.
3. Edit your OAuth 2.0 Client ID.
4. Under **Authorized JavaScript origins**, add your Vercel URL.
5. Under **Authorized redirect URIs**, ensure your Supabase callback URL is listed:
   `https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback`

---

## 🎉 You're Live!

Your application is now running in production! 
* Any time you push new code to your GitHub `main` branch, Vercel will automatically build and deploy the updates.
* Your database, files, and users are safely managed by Supabase.
