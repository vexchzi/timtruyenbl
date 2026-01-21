# Bug Fix Plan - Review & Rating System

## Goal
Fix issues in the newly implemented Review & Rating system (Admin UI CSS, undefined fields in old data) and cleanup redundant files from the old agent to align with the new system.

## Tasks - Phase 1: Review System Bug Fixes
- [ ] Fix CSS syntax error in `public/admin.html` (misplaced closing brace in `<style>`) -> Verify: Open admin.html, check dev console for CSS errors, inspect layout.
- [ ] Add data migration script for `Novel` schema (set default `ratingAverage=0`, `reviewCount=0` for old docs) -> Verify: Run script, check Mongo DB for fields.
- [ ] Verify `ReviewSection.jsx` build integration in `NovelModal.jsx` -> Verify: Open app, click novel, see reviews section loaded.

## Tasks - Phase 2: Project Cleanup
- [ ] Remove `scripts/recheckTag.js` and `scripts/removeThanThoaiTag.js` (ad-hoc scripts from old agent) -> Verify: File deletion.
- [ ] Consolidate random scripts into `.agent/scripts` if useful, or delete -> Verify: `list_dir scripts/` is clean.

## Tasks - Phase 3: Verification
- [ ] Restart Backend Server (`npm run dev`) -> Verify: Server starts without error.
- [ ] Check Review API (`GET /api/reviews/latest`) -> Verify: Returns JSON 200 OK.
- [ ] Check Admin Dashboard -> Verify: "Reviews" tab works, Delete button works.

## Done When
- [ ] Admin Dashboard UI is fixed (no CSS bugs).
- [ ] Old novels have correct default rating fields.
- [ ] System is clean of temporary scripts from previous dev sessions.
