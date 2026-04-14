# Commission Calculation System

A full-stack system for calculating insurance commissions in hierarchical sales organizations. Handles multi-level override commissions, volume-based bonuses, and clawback processing when policies are cancelled.

🌐 **[Live Demo](https://commission-calculation-system-beta.vercel.app/)**

---

## Overview

Insurance sales organizations rely on complex commission structures with multiple payout tiers. When a policy sells, commissions cascade through the org hierarchy. When a policy cancels, those commissions need to be clawed back—but the hierarchy may have changed since the original sale.

This system solves that problem by:
- Tracking agent hierarchies with 4 levels (Agent → Team Lead → Manager → Director)
- Calculating FYC and override commissions automatically on each sale
- Computing volume-based bonuses at monthly, quarterly, and annual intervals
- Processing clawbacks accurately using hierarchy snapshots from the time of sale

---

## Core Features

| Feature | Description |
|---------|-------------|
| **Agent Hierarchy** | 4-level structure with parent-child relationships and validation |
| **FYC Commission** | 50% of policy value to selling agent |
| **Override Commissions** | 2% (Team Lead), 1.5% (Manager), 1% (Director) cascade up the chain |
| **Volume Bonuses** | Tiered rates (2%-10%) based on monthly, quarterly, or annual sales volume |
| **Clawback Processing** | When policies cancel, commissions are reversed and bonuses recalculated |
| **Hierarchy Snapshots** | Preserves org structure at sale time for accurate clawback calculations |
| **Dashboard** | Summary stats, sales charts, recent transactions |

---

## Technical Architecture

### Backend

```
backend/
├── app.py              # Flask app, CORS, DB init (~100 lines)
├── models/             # SQLAlchemy models (7 tables)
├── routes/             # Flask blueprints (agents, sales, bonuses, dashboard)
├── services/           # Business logic (commission calc, bonus calc)
└── tests/              # pytest tests (39 passing)
```

- **Flask + SQLAlchemy** with SQLite
- **Modular structure** separating models, routes, and services
- **Transaction-safe** operations with rollback on errors
- **Comprehensive validation** on all API endpoints

### Frontend

```
commission-frontend/
├── src/
│   ├── components/     # Reusable UI components (10 directories)
│   ├── pages/          # Dashboard, AgentManagement, Sales, Reports, Clawbacks
│   └── App.tsx         # Routing and state management
```

- **React 19 + TypeScript** for type safety
- **Tailwind CSS** with CSS variables for theming
- **Axios** for API communication
- **Chart.js** for sales visualization

### Database Schema

| Table | Purpose |
|-------|---------|
| `Agent` | Hierarchical structure with self-referencing parent_id |
| `Sale` | Policy transactions with cancellation tracking |
| `Commission` | FYC and override commission records |
| `Bonus` | Volume-based bonus calculations by period |
| `Clawback` | Adjustment records linking to original commissions/bonuses |
| `HierarchySnapshot` | Preserves agent relationships at sale time |
| `PerformanceTier` | Volume thresholds and bonus rates by level |

---

## Design Decisions & Tradeoffs

### Why SQLite?

SQLite was chosen intentionally for this project:
- **Zero configuration** — works out of the box without database server setup
- **File-based** — easy to deploy and demo, database travels with the code
- **Sufficient scale** — handles thousands of agents and sales without issue
- **Clear upgrade path** — SQLAlchemy makes PostgreSQL migration straightforward when needed

For a demo/assessment context, the simplicity wins over horizontal scaling concerns.

### Why No Authentication?

Authentication and authorization are intentionally excluded:
- **Focus on business logic** — the core challenge is commission/bonus/clawback calculation, not auth boilerplate
- **Reduces noise** — no JWT handling or RBAC obscuring the actual domain logic
- **Common pattern for internal tools** — many financial admin systems run on trusted networks

In production, this would need JWT authentication with role-based access control.

### Why HierarchySnapshot?

This table solves a critical edge case: *what happens when an agent changes teams after making a sale, and that sale later gets cancelled?*

Without snapshots, clawback logic would use the current hierarchy, potentially clawing back from the wrong managers. The snapshot preserves exactly who was in the chain at sale time, ensuring:
- Correct commission reversal to the right people
- Accurate bonus recalculation for affected periods
- Audit-ready records of historical relationships

### Demo vs Production

| Aspect | Current Implementation | Production Would Need |
|--------|------------------------|----------------------|
| Database | SQLite | PostgreSQL with proper indexing |
| Auth | None | JWT + role-based access control |
| Clawbacks | Synchronous | Async queue for large batch processing |
| Deployment | Single instance (Render free tier) | Horizontal scaling, load balancing |
| Currency | Float | Decimal or integer cents |

---

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Runs on `http://localhost:5000`. Database initializes automatically.

### Frontend

```bash
cd commission-frontend
npm install
npm start
```

Opens at `http://localhost:3000`.

### Run Tests

```bash
cd backend
pytest tests/ -v
```

---

## Testing

The backend has 39 passing tests covering:
- Agent CRUD with hierarchy validation
- Commission calculation (FYC + overrides)
- Bonus calculation (monthly, quarterly, annual)
- Clawback processing with bonus recalculation
- Input validation (29 edge cases tested)

Tests use an in-memory SQLite database and reset state between runs.

---

## Deployment Notes

The live demo is deployed on free tiers:
- **Backend**: Render (free instance)
- **Frontend**: Vercel

Free tier instances spin down after inactivity. The first request may take 10-30 seconds while the backend cold starts. Subsequent requests are fast.

---

## What This Project Demonstrates

- **Complex business rules** — multi-level commission cascades, volume tiering, clawback recalculations
- **Correctness over optimization** — focus on getting the math right before worrying about performance
- **Thoughtful tradeoffs** — choosing SQLite and skipping auth because they're appropriate for the context, not because of ignorance
- **Modular architecture** — clean separation between data, routes, and business logic
- **Testing discipline** — covering edge cases and validation, not just happy paths



## API Reference

### Agents
- `POST /api/agents` — Create agent with name, level, parent_id
- `GET /api/agents` — Get hierarchy tree (or `?level=1` for flat list)
- `PUT /api/agents/:id` — Update agent
- `DELETE /api/agents/:id` — Delete agent (blocked if has sales or children)

### Sales
- `POST /api/sales` — Record sale (auto-creates commissions and snapshot)
- `GET /api/sales` — List all sales with agent names
- `PUT /api/sales/:id/cancel` — Cancel sale and process clawbacks

### Bonuses
- `POST /api/bonuses/calculate` — Calculate bonuses for a period (`{ "period": "2024-10", "type": "Monthly" }`)
- `GET /api/bonuses` — List all calculated bonuses

### Dashboard
- `GET /api/dashboard/summary` — Aggregated stats (total sales, commissions, bonuses, clawbacks, agent count)
