# Hammad StudyHub

> **Learn. Revise. Grow.**  
> *Your studies, organized in one place.*  
> **Created by Muhammad Hammad**

![Hammad StudyHub Banner](public/icon.svg)

---

## 1. Project Overview

**Hammad StudyHub** is a full-stack, open-access student learning and academic resource management platform built for students across institutions, degree programs, semesters, and courses.

### The Core Architectural Principle
> **"One platform. Every subject. Every lesson. Everything organized."**

Rather than scattering class materials across messaging groups, email threads, and chaotic folders, Hammad StudyHub organizes every study asset—lecture PDFs, whiteboard snapshots, video explanations, worksheets, and past papers—strictly by **academic calendar lesson date**.

Students can browse, search, bookmark, and review materials instantly on any device with **zero compulsory registration or paywalls**, while authorized administrators manage content effortlessly through a dedicated, secure dashboard.

---

## 2. Feature List

- **Daily-Wise Lesson Timeline**: Learning materials are grouped chronologically by their actual calendar class date, not their upload timestamp.
- **Multi-Category Content Types**:
  - 📕 **PDF Notes & Textbooks**: Embedded document preview with direct download capability.
  - 🎥 **Lecture Videos**: Embedded, responsive YouTube video player with distraction-free playback.
  - 🖼️ **Whiteboard & Diagram Snapshots**: High-resolution whiteboard photographs and circuit schematics.
  - 📝 **Assignments & Worksheets**: Practice exercises with deadlines and topic references.
  - 🎓 **Past Papers & Solutions**: Compiled previous examination papers and model answers.
  - 📊 **Presentation Slides**: Slide decks for quick chapter revisions.
- **Intelligent Google Drive Integration**:
  - Live link parser supporting Drive files, folders, Docs, Sheets, and Slides.
  - Automatic generation of secure embed preview links.
  - Real-time sharing permission advisory alerts.
  - Direct download link generation.
- **Zero-Friction Student Productivity**:
  - 🔖 **Saved Bookmarks**: Account-free, privacy-first local browser bookmarking that survives reloads.
  - 🕒 **Recently Viewed History**: Seamlessly pick up right where you left off.
  - ✅ **Revision Checklist**: Check off completed lessons as you study.
  - 🔍 **Debounced Global Search**: Instantly filter across subjects, topics, and tags.
- **Progressive Web App (PWA)**:
  - Installable on Android, iOS, Windows, and macOS.
  - Custom branded application icons and web app manifest.
  - Service worker caching for the app shell and offline navigation fallback.
  - Step-by-step install guidance modal for mobile users.
- **Robust Administration Dashboard**:
  - Real database-derived metric counters (no hardcoded statistics).
  - Subject CRUD (course code, color theme, icon, featured status).
  - Resource CRUD with lesson date controls and live URL tester.
  - Bulk CSV import & export with row-by-row validation.
  - Noticeboard announcement publishing.
  - Feedback and broken-link report queue.
- **Dual-Mode Resilient Architecture**:
  - **Live Cloud Mode**: Connects directly to Supabase PostgreSQL with Row Level Security (RLS).
  - **Local Demo Mode**: Seamlessly falls back to an interactive, persistent local storage demo provider when Supabase credentials are not yet entered.

---

## 3. Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18 + Vite |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS (Navy brand theme + Dark/Light Mode) |
| **Routing** | React Router v6 |
| **Server State** | TanStack Query v5 |
| **Form Handling** | React Hook Form + Zod Schema Validation |
| **Icons** | Lucide React |
| **Backend & Database** | Supabase (PostgreSQL 15 + Supabase Auth + RLS) |
| **Testing Suite** | Vitest + React Testing Library + jsdom |
| **Deployment Target** | Vercel (SPA routing configured via `vercel.json`) |

---

## 4. Folder Structure

```
Hammad Study Hub/
├── .env.example              # Safe environment variable template
├── .gitignore                # Git ignore rules
├── index.html                # App shell with SEO tags and PWA manifest links
├── package.json              # Dependencies and scripts
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Academic palette & dark mode setup
├── tsconfig.json             # Strict TypeScript configuration
├── tsconfig.node.json        # Vite bundler TS config
├── vercel.json               # Vercel SPA rewrite & security headers
├── vite.config.ts            # Vite & Vitest test configuration
├── public/
│   ├── favicon.svg           # Branded Hammad StudyHub monogram mark
│   ├── icon.svg              # Scalable vector PWA icon
│   ├── manifest.webmanifest  # PWA web manifest
│   └── sw.js                 # Service worker with offline shell caching
├── supabase/
│   ├── migrations/
│   │   └── 20261029000000_init_hammad_studyhub.sql # Full schema, triggers & RLS
│   └── seed.sql              # Curated academic demo data
└── src/
    ├── main.tsx              # Application entry point & PWA registration
    ├── App.tsx               # Route definitions & TanStack Query provider
    ├── index.css             # Tailwind base & accessibility motion rules
    ├── vite-env.d.ts         # Environment variable type declarations
    ├── types/
    │   └── index.ts          # Core domain models and filter interfaces
    ├── lib/
    │   ├── supabase.ts       # Supabase client with graceful demo mode fallback
    │   ├── googleDrive.ts    # Google Drive & YouTube URL parser & embed generator
    │   ├── utils.ts          # Date formatters, slugify, CSV exporter & importer
    │   ├── storage.ts        # LocalStorage bookmarks, recent history & checklist
    │   ├── mockData.ts       # High-fidelity sample courses & daily lessons
    │   └── demoStore.ts      # In-browser persistent demo data store
    ├── context/
    │   ├── AuthContext.tsx   # Supabase Auth + 1-click Demo Admin login
    │   └── ThemeContext.tsx  # Dark / Light / System theme synchronization
    ├── hooks/
    │   ├── useSubjects.ts    # Subject queries and mutations
    │   ├── useResources.ts   # Resource timeline queries, filters, and mutations
    │   ├── useAnnouncements.ts# Noticeboard queries and mutations
    │   └── useFeedback.ts    # Feedback submission & reporting
    ├── components/
    │   ├── common/           # Button, Input, Modal, Badge, Card, SEOHead, PWA Banner
    │   ├── layout/           # Navbar, Footer, PublicLayout, AdminLayout
    │   ├── subject/          # SubjectCard, SubjectFilterBar
    │   ├── resource/         # ResourceCard, ResourceTimeline, ResourceViewer, ReportModal
    │   └── admin/            # StatsOverview, ResourceFormModal, SubjectFormModal, CSV Import
    ├── pages/
    │   ├── HomePage.tsx      # Hero, global search, categories, featured courses
    │   ├── SubjectsPage.tsx  # Course directory with code search
    │   ├── SubjectDetailPage.tsx # Daily lesson timeline & resource filters
    │   ├── ResourceDetailPage.tsx# In-browser document viewer & related materials
    │   ├── SearchPage.tsx    # Debounced search across all courses
    │   ├── BookmarksPage.tsx # Locally saved revision bookmarks
    │   ├── RecentPage.tsx    # Recently viewed browsing history
    │   ├── AnnouncementsPage.tsx # Academic notices & exam deadlines
    │   ├── AboutPage.tsx     # Platform mission & Muhammad Hammad profile
    │   ├── FeedbackPage.tsx  # Student suggestions & broken-link reporting
    │   ├── PrivacyPage.tsx   # Student privacy declaration
    │   ├── TermsPage.tsx     # Academic fair use guidelines
    │   ├── NotFoundPage.tsx  # Friendly 404 page
    │   └── admin/
    │       ├── AdminLoginPage.tsx        # Secure administrator login
    │       ├── AdminDashboardPage.tsx    # Real-time metrics & publishing feed
    │       ├── AdminSubjectsPage.tsx     # Subject CRUD table
    │       ├── AdminResourcesPage.tsx    # Resource CRUD, CSV import/export
    │       ├── AdminAnnouncementsPage.tsx# Noticeboard controls
    │       └── AdminSettingsPage.tsx     # Branding & database status
    └── test/
        ├── setup.ts          # Vitest and jsdom environment setup
        ├── googleDrive.test.ts# Google Drive and YouTube parser tests
        ├── dateUtils.test.ts # Date-only formatting and grouping tests
        ├── bookmarks.test.ts # LocalStorage bookmark persistence tests
        └── csvParser.test.ts # CSV bulk import parser tests
```

---

## 5. Prerequisites

Before installing the project, verify that your machine has:
1. **Node.js**: v18.0.0 or later (v20+ recommended).
2. **npm**: v9.0.0 or later.
3. **PowerShell** (on Windows) or any modern terminal.

Check your versions in PowerShell:
```powershell
node -v
npm -v
```

---

## 6. Local Setup Instructions for Windows

Open **Windows PowerShell** and navigate to your project directory:

```powershell
# Navigate to the project directory
cd "C:\Users\M Hammad\Desktop\Hammad Study Hub"
```

---

## 7. Commands to Install Dependencies and Start the Application

```powershell
# 1. Install all dependencies cleanly
npm install

# 2. Run the automated test suite
npm run test

# 3. Check strict TypeScript compilation
npx tsc --noEmit

# 4. Start the local development server
npm run dev
```

Open your browser and navigate to: **`http://localhost:3000`**

---

## 8. How to Create a Supabase Project

1. Navigate to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **"New Project"**.
3. Fill in the project details:
   - **Name**: `hammad-studyhub`
   - **Database Password**: Choose a strong password and save it securely.
   - **Region**: Select a region close to your target students.
   - **Pricing Plan**: Choose **Free Plan**.
4. Click **"Create new project"** and allow 1–2 minutes for database provisioning.

---

## 9. How to Configure Environment Variables

1. In the root directory, create a `.env` file by copying the template:
   ```powershell
   Copy-Item .env.example .env
   ```
2. In your Supabase dashboard, go to **Project Settings** (gear icon) → **API**.
3. Copy your:
   - **Project URL** (e.g. `https://xyzproject.supabase.co`)
   - **Project API Key (anon / public)** (safe for browser usage)
4. Open `.env` and fill in the values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key-here
   VITE_DEMO_MODE=false
   VITE_APP_TITLE="Hammad StudyHub"
   VITE_APP_CREATOR="Muhammad Hammad"
   ```

> **Security Rule**: Never place the `service_role` key in `.env` or frontend files. Only the `anon` public key is permitted.

---

## 10. How to Apply Database Migrations

1. In your Supabase Dashboard, open the **SQL Editor** from the left navigation bar.
2. Click **"New Query"**.
3. Open `supabase/migrations/20261029000000_init_hammad_studyhub.sql` in your code editor, copy the entire SQL script, paste it into the Supabase SQL Editor, and click **"Run"**.
4. The migration will create:
   - All 9 relational tables (`profiles`, `institutions`, `academic_programs`, `semesters`, `subjects`, `resources`, `announcements`, `feedback`, `platform_settings`).
   - Performance B-tree and PostgreSQL Trigram full-text search indexes.
   - The security helper function `public.is_admin()`.
   - Comprehensive Row Level Security (RLS) policies granting public read access to published materials while restricting write access to verified administrators.

---

## 11. How to Create the First Administrator

Because open public administrator registration is disabled for security, follow this bootstrap procedure:

1. In your Supabase Dashboard, go to **Authentication** → **Users** → click **"Add user"** → **"Create user"**.
2. Enter the administrator's email (e.g. `hammad@yourdomain.com`) and a strong password. Click **Create User**.
3. Promote this user to the `'admin'` role by running this command in the Supabase **SQL Editor**:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'hammad@yourdomain.com');
   ```
4. Now, visit `http://localhost:3000/admin/login` on your website, sign in with this email and password, and you will enter the Administrator Dashboard!

---

## 12. How to Seed Demo Data

To populate your database with representative courses (Computer Programming, Digital Logic Design, Functional English, etc.) and daily lesson resources:

1. Open the Supabase **SQL Editor**.
2. Open `supabase/seed.sql` in your editor, copy the content, paste it into the SQL Editor, and click **"Run"**.
3. All sample subjects and dated resources will now appear in your live database.

---

## 13. How to Connect Google Drive Resources

Hammad StudyHub embeds Google Drive documents without storing gigabytes of PDFs on paid database storage.

### Best Practice for Sharing Files:
1. Upload your lecture PDF, handwritten notes, or whiteboard photo to your Google Drive.
2. Right-click the file → **Share** → **Share**.
3. Under **General access**, change the setting to:
   > **"Anyone with the link"** and permission set to **"Viewer"**.
4. Click **"Copy link"**.
5. In the Hammad StudyHub Admin Dashboard (`/admin/resources` → **Add Resource**):
   - Paste the copied link into the **Google Drive or Media URL** field.
   - StudyHub will automatically validate the URL, extract the File ID, and configure the embed preview URL (`/preview`) and the direct download URL.
   - Select the **Target Subject**, content type, and the exact **Lesson Date** of the class.
   - Click **Save & Publish**.

---

## 14. How to Create and Configure the GitHub Repository

Run these commands in Windows PowerShell:

```powershell
# 1. Initialize git if not already initialized
git init

# 2. Add all files
git add .

# 3. Commit the initial release
git commit -m "feat: complete initial release of Hammad StudyHub by Muhammad Hammad"

# 4. Create your repository on GitHub (via GitHub website: https://github.com/new)
# Then link and push:
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/hammad-studyhub.git
git branch -M main
git push -u origin main
```

---

## 15. How to Deploy to Vercel

1. Log in to [https://vercel.com](https://vercel.com).
2. Click **"Add New..."** → **"Project"**.
3. Import your `hammad-studyhub` GitHub repository.
4. In the **Configure Project** screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - `VITE_SUPABASE_URL`: (your Supabase URL)
   - `VITE_SUPABASE_ANON_KEY`: (your Supabase anon key)
   - `VITE_DEMO_MODE`: `false`
6. Click **"Deploy"**.
7. Once deployed, Vercel provides a live production URL (e.g., `https://hammad-studyhub.vercel.app`).
8. Add your Vercel URL to **Supabase Dashboard** → **Authentication** → **URL Configuration** → **Site URL** and **Redirect URLs** so password reset and authentication links work in production.

---

## 16. How to Install the PWA on Mobile Devices

### On Android (Chrome / Edge)
1. Open your live website URL in Chrome.
2. An **"Install App"** banner will appear at the top of the screen.
3. Tap **Install App**, or tap the browser menu (three dots) → **"Install app"** / **"Add to Home screen"**.
4. The Hammad StudyHub app icon will be added to your home screen and run full-screen without browser URL bars.

### On iPhone / iPad (Safari)
1. Open the website in Safari.
2. Tap the **Share** button (box with an upward arrow) in the bottom navigation bar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add** in the top-right corner.

---

## 17. How to Back Up Resources and Database Data

1. **Database Schema & Records Backup**:
   - In Supabase Dashboard, go to **Database** → **Backups**. Supabase automatically creates daily point-in-time backups.
   - For an offline backup, you can export tables to CSV via **Table Editor** → select table → click **"Export"**.
2. **Bulk Resource CSV Export**:
   - Go to your Hammad StudyHub Admin Dashboard (`/admin/resources`).
   - Click the **"Export CSV"** button. This downloads a comprehensive CSV file containing every resource title, subject, lesson date, topic, chapter, tags, status, and Google Drive URL.

---

## 18. How to Troubleshoot Common Errors

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **"Access Denied: You need permission" in Google Drive preview** | Google Drive file is set to "Restricted" rather than "Anyone with the link can view". | Open Google Drive, right-click the file, click **Share**, and set General Access to **"Anyone with the link: Viewer"**. |
| **Blank white screen after Vercel deployment** | Missing environment variables or SPA client-side routing misconfiguration. | Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are entered in Vercel project settings. Ensure `vercel.json` exists in repository root. |
| **"Invalid login credentials" in Admin Login** | User does not exist in Supabase Auth or has not been promoted to `admin` role. | Verify user exists in Supabase Authentication. Run the `UPDATE public.profiles SET role = 'admin' ...` SQL query from Section 11. |
| **"Failed to load resource: net::ERR_CONNECTION_REFUSED" locally** | Vite development server is not running. | Run `npm run dev` in PowerShell and check that `http://localhost:3000` is active. |

---

## 19. Known Limitations of Free Tiers

- **Supabase Free Tier**:
  - Automatically pauses databases after 7 consecutive days of inactivity. (Simply click "Restore" in the Supabase dashboard if this occurs).
  - Storage limit is 500 MB for database files (hosting PDFs on Google Drive as configured bypasses this limitation entirely).
- **Vercel Hobby Plan**:
  - 100 GB monthly bandwidth (ample for thousands of student visits when documents and videos are hosted on Google Drive and YouTube).

---

## 20. Remaining Tasks Requiring Human Account Access

The application is completely written, fully tested, and ready to go. The only steps requiring human intervention are:
1. **Supabase Project Creation**: Register a free project on [supabase.com](https://supabase.com) and copy your project URL and public anon key into `.env`.
2. **First Admin Sign-up**: Create your email account in Supabase Authentication and promote your user to `'admin'` via SQL.
3. **GitHub & Vercel Publishing**: Connect your GitHub repository to Vercel for continuous deployment.

---

## Verification & Test Results

```
Test Files  4 passed (4)
Tests       23 passed (23)
TypeScript  Zero errors (npx tsc --noEmit: exit 0)
Build       Production bundle generated cleanly in dist/
```

Developed with academic excellence by **Muhammad Hammad**.
