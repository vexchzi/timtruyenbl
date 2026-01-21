# TimTruyenBL - Agent & Architecture Mapping

> **Project Profile**: MERN Stack (MongoDB, Express, React, Node.js)
> **Goal**: Content Recommender System (BL Novels)

Results from `ag-kit` analysis on 2026-01-21.

---

## 🎯 Selected Agents for TimTruyenBL

Based on your project structure, these are the **5 Key Agents** you should utilize for future upgrades (like Ranking & Voting).

| Agent | Role | Relevant Skills | Why? |
|-------|------|-----------------|------|
| **`project-planner`** | **Architect** | `brainstorming`, `plan-writing`, `architecture` | Crucial for defining the logic of "Rankings" (algorithm?) and "Voting" (anonymous vs registered?) before coding. |
| **`frontend-specialist`** | **UI/UX dev** | `react-patterns`, `tailwind-patterns`, `ui-ux-pro-max`, `frontend-design` | You use **Vite + React + Tailwind**. This agent optimizes components and ensures responsive design. |
| **`backend-specialist`** | **API dev** | `api-patterns`, `nodejs-best-practices` | You use **Express**. This agent handles API routes, middleware, and performance validation. |
| **`database-architect`** | **Data dev** | `database-design` | You use **Mongoose**. This agent helps design efficient schemas for high-volume data (Votes/Logs). |
| **`orchestrator`** | **Manager** | `parallel-agents` | Use this for complex features that touch both frontend and backend simultaneously. |

---

## 🚀 Recommended Workflow: "Ranking + Vote" Feature

To implement the request "Ranking + Vote" correctly, follow this standard flow:

### Phase 1: Planning (Agent: `project-planner`)
1.  **Define Rules**: How is "Rank" calculated? (Views? Votes? Recency?)
2.  **Define Constraints**: Can guests vote? One vote per IP? Daily limit?
3.  **Output**: A `features/ranking_voting.md` plan file.

### Phase 2: Database (Agent: `database-architect`)
1.  **Schema Update**:
    *   Add `Vote` collection (user/ip, novelId, timestamp).
    *   Update `Novel` schema with `voteCount`, `rankScore`.
2.  **Optimization**: Create indexes for fast sorting.

### Phase 3: Backend (Agent: `backend-specialist`)
1.  **API**: `POST /api/vote`, `GET /api/ranking`.
2.  **Security**: Rate limiting (10 votes/min/IP) to prevent spam.

### Phase 4: Frontend (Agent: `frontend-specialist`)
1.  **UI**: Create `RankingPage.jsx` and `VoteButton` component.
2.  **Integration**: Connect to APIs.

---

## 📂 Project Structure Map

**Frontend (`client/`)**
*   **Tech**: React 18, Vite, Tailwind CSS.
*   **Key Path**: `client/src/components` (UI), `client/src/services` (API calls).

**Backend (`/`)**
*   **Tech**: Node.js, Express, MongoDB.
*   **Key Path**: `models/` (Schemas), `controllers/` (Logic), `routes/` (Endpoints).

---

## 💡 Quick Commands

*   **Plan a feature**: `/plan "Create a ranking system taking views and votes into account"`
*   **Fix a bug**: `/debug "API returns 500 when voting"`
*   **New UI Component**: `/ui-ux-pro-max "Design a gold/silver/bronze ranking card"`
