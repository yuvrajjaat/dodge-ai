# DodgeAI - SAP Order-to-Cash Graph Intelligence

## 1. Overview

DodgeAI is an interactive graph visualization and conversational query system built on top of an SAP Order-to-Cash (O2C) dataset. It allows users to visually explore the relationships between sales orders, deliveries, billing documents, payments, customers, products, and plants -- and ask natural language questions that are answered directly from the data.

The system reads all data locally from JSONL files. No external data sources are used. Every answer is grounded strictly in the dataset.

---

## 2. Architecture

```
User
 |
 v
React Frontend (port 3000)
 |--- Graph Visualization (React Flow)
 |--- Chat Panel (natural language queries)
 |
 v
Node.js Backend (port 3001)
 |--- Express API (POST /query)
 |--- Guardrails (keyword filter, injection blocking)
 |--- LLM via OpenRouter (NL -> SQL, Results -> NL)
 |--- SQLite via better-sqlite3 (query execution)
 |
 v
SAP O2C Data (19 JSONL tables, ~21K records)
```

**Flow:**
1. User asks a question in the chat panel
2. Frontend sends it to the backend (`POST /query`)
3. Backend runs guardrails to filter off-topic or malicious queries
4. LLM (via OpenRouter) converts the natural language question into a SQL query
5. SQL is executed against SQLite (loaded from JSONL at startup)
6. LLM formats the results into a natural language answer
7. Response is returned to the frontend with the answer, raw data, and SQL

---

## 3. Graph Modeling

### Nodes (7 types)

| Node Type | Source Table | Count |
|-----------|-------------|-------|
| Customer | business_partners | 8 |
| SalesOrder | sales_order_headers | 100 |
| Delivery | outbound_delivery_headers | 86 |
| BillingDocument | billing_document_headers | 163 |
| Payment | journal_entry_items_accounts_receivable | 123 |
| Product | products | 69 |
| Plant | plants | 44 |

### Relationships (edges)

| Edge | Meaning | Derived From |
|------|---------|-------------|
| Customer -> SalesOrder | places | sales_order_headers.soldToParty |
| SalesOrder -> Product | contains | sales_order_items.material |
| SalesOrder -> Plant | ships_from | sales_order_items.productionPlant |
| SalesOrder -> Delivery | fulfilled_by | outbound_delivery_items.referenceSdDocument |
| Delivery -> BillingDocument | billed_in | billing_document_items.referenceSdDocument |
| BillingDocument -> Payment | accounted_in | journal_entry_items.referenceDocument |
| Customer -> BillingDocument | billed_to | billing_document_headers.soldToParty |
| Customer -> Payment | pays | journal_entry_items.customer |

### Why this design

The graph follows the standard SAP O2C process flow:

```
Customer -> Sales Order -> Delivery -> Billing -> Payment
```

This mirrors how a real business transaction flows through an ERP system. Supporting entities (Product, Plant) are connected to Sales Orders where they are referenced. Relationships are inferred from foreign key fields in the JSONL data -- no assumptions are made about joins that don't exist in the data.

---

## 4. Database Choice

**SQLite** (via `better-sqlite3`) was chosen for the query execution layer.

- **Simplicity**: Single file database, no server to install or configure. The entire dataset (~21K records across 19 tables) loads in under 1 second at startup.
- **Structured queries**: SQL is a natural fit for the relational JSONL data. The LLM generates standard SQL SELECT statements, and SQLite executes them directly. No custom query language or graph traversal logic needed.
- **Synchronous API**: `better-sqlite3` provides a synchronous API, which simplifies the request-response pipeline. No async/await chains for database calls.
- **Zero infrastructure**: No database server to manage. The `.db` file is created automatically from the JSONL source data on first run.

All columns are stored as TEXT (matching the JSONL source format). The LLM is instructed to use `CAST()` for numeric operations and `date()` for date comparisons.

---

## 5. LLM Strategy

The LLM is used in two stages, never for generating answers directly.

### Stage 1: Natural Language -> SQL

The user's question is sent to the LLM along with a system prompt that contains:
- All 19 `CREATE TABLE` statements with exact column names
- A join relationship map showing how tables connect
- Strict rules (SELECT only, correct column names, CAST for numbers, LIMIT behavior)
- Few-shot examples covering common query patterns

The LLM outputs a raw SQL query. Temperature is set to 0 for deterministic output.

### Stage 2: SQL Results -> Natural Language

The query results (JSON rows) are sent back to the LLM with the original question. The LLM formats the data into a concise, readable answer. Temperature is set to 0.3 for slight variation in phrasing.

### Prompt Design

- The system prompt includes the full database schema so the LLM cannot hallucinate column names
- Join relationships are explicitly documented with comments
- Rules enforce safety (no DDL/DML, only SELECT)
- If the SQL fails, the error is sent back to the LLM for one retry attempt
- If the question cannot be answered from the data, the LLM returns `NOT_ANSWERABLE`

---

## 6. Guardrails

Queries are filtered before reaching the LLM using two layers:

### Layer 1: Blocklist

Rejects queries containing SQL injection patterns:
- `DROP`, `DELETE`, `INSERT`, `UPDATE`, `ALTER`, `TRUNCATE`
- `; --`, `UNION SELECT`, `INTO OUTFILE`, `LOAD_FILE`

Returns a 400 error immediately.

### Layer 2: Topic Relevance

The query must contain at least one domain keyword from an allowlist of ~50 terms related to SAP O2C (e.g., `order`, `customer`, `delivery`, `invoice`, `payment`, `product`, `status`, `total`, `amount`, etc.).

If no domain keyword is found, the system responds:
> "I can only answer questions about SAP Order-to-Cash data (sales orders, deliveries, billing, payments, customers, products, etc.)."

This is intentionally permissive -- it catches clearly off-topic queries ("tell me a joke") without blocking legitimate business questions.

---

## 7. How to Run

### Prerequisites
- Node.js 18+ (tested on Node 22)
- An OpenRouter API key (free tier works)

### Backend

```bash
cd backend
npm install
```

Edit `.env` and set your OpenRouter API key:
```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Start the server:
```bash
npm start
```

The backend runs on `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend runs on `http://localhost:3000` and proxies API requests to the backend.

### Build Graph Data (optional, already pre-built)

```bash
cd frontend
node scripts/build-graph.js
```

---

## 8. Demo

> **Live Demo**: https://dodgeai-backend-un2l.onrender.com/

---

## 9. Project Structure

```
DodgeAI/
  README.md
  backend/            # Node.js + Express API + SQLite
    src/
      server.js       # Entry point, serves frontend + API
      db/             # Schema definitions, JSONL loader
      llm/            # OpenRouter integration, prompt engineering
      routes/         # POST /query pipeline
      middleware/     # Guardrails (injection + topic filter)
  frontend/           # React + React Flow graph UI
    src/
      App.js          # Main app with graph + chat panel
      components/     # GraphView, QueryPanel, MetadataPanel, SearchBar, Legend
    scripts/
      build-graph.js  # JSONL → graph-data.json converter
  sap-o2c-data/       # Raw dataset (19 JSONL tables)
  sessions/           # AI coding session logs (Claude Code)
```
