# Reorganization Report

## What changed

- Moved `src/App.jsx` to `src/app/App.jsx`.
- Grouped public route pages under `src/pages/public/`.
- Grouped portal route entry pages under `src/pages/portals/`.
- Grouped public website components by purpose under `src/components/public/`.
- Moved brand assets into `src/assets/images/brand/`.
- Updated relative imports for moved files.
- Removed `.git` from the delivery copy so replacing project files will not overwrite the original repository metadata.
- Removed generated project-tree text files from the delivery copy.

## Removed legacy/unreferenced public source files

The following files were not reachable from the application entry dependency graph in the uploaded copy and were removed as legacy public-source cleanup:

- `src/components/Chatbot.jsx`
- `src/components/CourseFinder.jsx`
- `src/components/CursorGlow.jsx`
- `src/components/FAQ.jsx`
- `src/components/Home.jsx`
- `src/components/LivePopup.jsx`
- `src/components/MagneticButton.jsx`
- `src/components/PageHeader.jsx`
- `src/components/PublicWebsitePolishLayer.jsx`
- `src/components/Reveal.jsx`
- `src/components/Services.jsx`
- `src/components/Testimonials.jsx`
- `src/components/WhatsAppButton.jsx`
- `src/components/logo.jsx`
- `src/components/old-sections/About.jsx`
- `src/components/old-sections/Process.jsx`
- `src/components/old-sections/Stats.jsx`
- `src/components/old-sections/Trust.jsx`
- `src/components/website/StudyDestinationHub.jsx`
- `src/pages/AboutPage.jsx`
- `src/pages/ContactPage.jsx`

## Removed unused legacy assets

- old `src/assets/public-website/` reference/design pack
- old About/Trust/Testimonial assets no longer referenced after legacy component removal
- unused duplicate contact assets
- unused Dream Support mascot duplicate
- unused service/country legacy assets
- old Vite starter asset and unused root hero/student assets

## Intentionally retained

A number of admin/CRM/portal modules are not currently reachable from the main route graph, but were retained because they appear to be part of broader business-system modules rather than obvious abandoned public-site leftovers. They should only be deleted during a dedicated Admin/CRM audit.

All Italian university image files were retained because the university data loader uses `import.meta.glob()` to resolve images dynamically by slug.

## Validation performed

A static relative-import resolution check was run after moving files. No unresolved relative JavaScript/JSX imports remained in the reorganized copy.

A full `npm` build could not be executed in this environment because dependencies were not available in the uploaded copy and package installation was unavailable here. After restoring the three files you mentioned, run `npm install` (or use your existing `node_modules`) and `npm run build` in your local project before replacing the production branch.
