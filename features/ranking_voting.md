# Feature Plan: Ranking & Voting System

## Goal
Implement a dynamic **Ranking System** based on views/votes and a **Voting Mechanism** (with rate limiting) to allow users to support their favorite novels.

## Phase 1: Database Design (Agent: `database-architect`)
- [x] Create `models/Vote.js` Schema -> Verify: File exists with fields: `novelId` (Ref), `ipAddress`, `fingerprint`, `createdAt`.
- [x] Update `models/Novel.js` -> Verify: Add fields `voteCount` (Number), `weeklyScore` (Number).
- [x] Optimize Indexes -> Verify: MongoDB indexes on `voteCount` and `weeklyScore` for fast sorting.

## Phase 2: Backend API (Agent: `backend-specialist`)
- [x] Create `controllers/voteController.js` -> Verify: Logic for `addVote` (check duplicates via IP/Time), `getRankings` (sort by score).
- [x] Create `routes/voteRoutes.js` -> Verify: Endpoints `POST /api/votes`, `GET /api/rankings`.
- [x] Implement Rate Limiting Strategy -> Verify: Prevent >1 vote per 24h per IP.

## Phase 3: Frontend UI (Agent: `frontend-specialist`)
- [x] Create `components/VoteButton.jsx` -> Verify: Button in `NovelModal` that calls API and updates UI state (Voted/Not Voted).
- [x] Create `components/RankingPage.jsx` -> Verify: New page displaying Top 10/20 novels tabbed by "Top Vote", "Top View", "Newest".
- [x] Add "Ranking" link to `Navigation` in `App.jsx` -> Verify: Link appears in navbar.

## Phase 4: Integration & Testing
- [x] Test Voting Flow -> Verify: Click vote -> Database updates -> UI increments count. (User testing)
- [x] Test Spam Protection -> Verify: Spam click -> Error "Already voted today". (User testing)
- [x] Test Ranking Sorting -> Verify: `GET /api/rankings` returns correct order. (User testing)

## Done When
- [x] Users can vote for novels daily.
- [x] A "Bảng Xếp Hạng" (Ranking) page shows top novels.
- [x] Spam voting is prevented.
