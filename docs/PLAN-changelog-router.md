# PLAN-changelog-router.md

> **Task**: Refactor Navigation & Add Changelog System
> **Goal**: Fix navigation UX (F5/Back button) and implement an update history display.

---

## 🏗️ Architecture & Requirements

### 1. Navigation Refactor (Critical UX Fix)
- **Problem**: Current `useState` based navigation breaks on Refresh (F5) and Phone Back Button.
- **Solution**: Migrate to `react-router-dom`.
- **Routes**:
  - `/` -> Home
  - `/browse` -> BrowsePage (Library)
  - `/ranking` -> RankingPage
  - `/novel/:id` -> Deep link to open NovelModal (overlaid or separate).

### 2. Changelog System
- **Goal**: Allow admins to post updates; Users to view history.
- **Data Model** (`UpdateLog`):
  - `version`: String (e.g. "1.2.0")
  - `date`: Date
  - `content`: Array of Strings (bullet points)
  - `type`: String (feature/fix/improvement)
- **UI**:
  - **Admin**: New/Edit Update Log.
  - **User**: "Cập nhật" (Changelog) link in Footer -> Opens Modal.

---

## 📋 Task Breakdown

### Phase 1: Frontend Infrastructure (Routing)
- [ ] **Install**: `npm install react-router-dom` in `client/`
- [ ] **Refactor `App.jsx`**:
  - Replace `currentPage` state with `<Routes>`.
  - Wrap app in `<BrowserRouter>`.
- [ ] **Fix `NovelModal`**:
  - Handle `/novel/:id` URL.
  - When accessing via URL, show modal over `BrowsePage` or as standalone.
  - Ensure logic: Closing modal -> goes back to previous route (or `/browse`).

### Phase 2: Backend & Database
- [ ] **Model**: Create `models/UpdateLog.js`.
- [ ] **API**: `routes/updates.js`
  - `GET /api/updates` (Public, sorted newest first)
  - `POST /api/updates` (Admin only)
  - `DELETE /api/updates/:id` (Admin only)
- [ ] **Register**: Add to `server.js`.

### Phase 3: Admin Panel
- [ ] **UI Update**: Add "Changelog" tab to `public/admin.html`.
- [ ] **Logic**: Fetch existing logs, Form to add new version, Delete button.

### Phase 4: User UI (Frontend)
- [ ] **Component**: `components/ChangelogModal.jsx` (Timeline style).
- [ ] **Integration**:
  - Fetch updates on mount (or lazy load on click).
  - Add "Phiên bản/Cập nhật" link in Footer.
  - (Optional) visual indicator for "New" updates.

---

## 🤖 Agent Assignments

| Agent | Task |
|-------|------|
| `frontend-specialist` | Install Router, Refactor App.jsx, Create ChangelogModal |
| `backend-specialist` | Create UpdateLog model, API routes |
| `frontend-specialist` | Update admin.html (vanilla JS/HTML) |

## ✅ Verification Checklist
1. **Routing**:
   - [ ] F5 on `/ranking` stays on Ranking.
   - [ ] Back button from Novel Modal closes modal.
   - [ ] Direct link to `/novel/123` works.
2. **Changelog**:
   - [ ] Admin can add update "v1.0".
   - [ ] User sees "v1.0" in Changelog Modal.
   - [ ] Data persists in MongoDB.
