# Zaifan Consultancy Project Architecture

This project was reorganized to make the public website, portal systems, data, services, and assets easier to find without changing the application architecture unnecessarily.

## Main entry points

- `src/main.jsx` — React application bootstrap.
- `src/app/App.jsx` — top-level routing, global loading screen, navbar visibility, and page transitions.

## Public website

### Pages

Public route-level pages live in:

`src/pages/public/`

This includes the homepage, services, countries, Italy guide, city pages, universities, appointment, and 404 page.

### Components

Public website components live in:

`src/components/public/`

Subfolders:

- `home/` — homepage sections such as Hero, Countries, Dream Support, Universities, and More Ways We Help.
- `layout/` — Navbar, Footer, and Floating Consultation CTA.
- `contact/` — public contact experience.
- `scholarships/` — Scholarship Explorer / scholarship hub UI.
- `shared/` — reusable public-site helpers such as ScrollToTop.

## Portal entry pages

Portal route entry pages live in:

`src/pages/portals/`

- `AdminPage.jsx`
- `StudentPortalPage.jsx`
- `CounselorPortalPage.jsx`

## Portal components

- `src/components/admin/` — admin/CRM/business operating system.
- `src/components/counselor/` — counselor portal workspaces.
- `src/components/student/` — student portal authentication/dashboard.

The admin system already contains domain subfolders such as analytics, communication, finance, HR, knowledge, marketing, mobile, partner, compliance, and AI command. These were intentionally preserved instead of aggressively moving hundreds of internal files without a dedicated portal refactor.

## Data

`src/data/`

- public content registries and route data
- Italian cities and universities
- services data
- CRM pipeline configuration

## Services and business logic

- `src/services/` — CRM, AI, automation, scoring, notification, and application services.
- `src/lib/` — shared platform engines and Supabase/client helpers.
- `src/hooks/` — reusable React hooks.
- `src/utils/` — utilities, including CRM-specific utilities.

## Assets

`src/assets/images/`

Images are grouped by feature/domain, including:

- `brand/`
- `appointment/`
- `contact/`
- `country-explorer/`
- `dream-support/`
- `services/`
- `universities/`
- `zaifan/`

Unused legacy public-site image packs and unused old-section images were removed from this reorganized copy.

## Supabase

`supabase/`

Supabase configuration/functions remain separate from frontend source code.

## Important project rules

- The main homepage is `src/pages/public/Home.jsx` in this reorganized copy.
- Public service detail routing remains dynamic through `/services/:serviceSlug`.
- Do not create fake Success Stories.
- DSU remains part of the scholarship/Italy ecosystem rather than a standalone page.
- Official WhatsApp number: `03305718131`; international/wa.me form: `923305718131`.
- Keep motion, accordion, and dropdown behavior consistent across the public website.

## Recommended next phase

This restructure is intentionally conservative around the large admin/CRM ecosystem. The next engineering phase should focus on:

1. Build/runtime verification after restoring the three files missing from the uploaded copy.
2. Performance profiling.
3. Route-level lazy loading and code splitting.
4. Image compression and modern formats.
5. Shared motion/accordion primitives.
6. Final internal-link, contact-detail, and social-link audits.
