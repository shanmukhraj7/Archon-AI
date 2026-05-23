# Archon AI — v2.0 (Local Edition)

A production-grade **multi-agent GenAI research platform** that deploys 6 specialized AI agents in a self-correcting LangGraph pipeline to search the web, validate sources, and synthesize structured, exportable research reports — powered by Hybrid RAG, RAGAS evaluation, and a conditional ReAct review loop. 

**This version has been fully migrated to use 100% Local LLMs via Ollama to avoid cloud API rate limits and costs!**

---

## What It Does

Give it a query like:

> "Analyze AI adoption trends in fintech for 2024–2025 and give me a structured report"

It will:
1. Break the query into sub-tasks (planner agent)
2. Search the web for current information (via Tavily)
3. Search your uploaded documents (via RAG + ChromaDB)
4. Reason over retrieved context using **local Llama 3.2**
5. Produce a structured report with sections, tables, and a summary
6. Let you export the report as a PDF

---

## Architecture Overview

```text
User Query
    │
    ▼
Orchestrator Agent (LangGraph)
    │  ├── Planner Agent
    │  ├── Researcher Agent (Hybrid BM25 + Semantic)
    │  ├── Validator Agent
    │  ├── Summarizer Agent
    │  ├── Report Writer Agent
    │  └── Reviewer Agent (with self-correcting loop)
    │
    ▼
Structured Output Engine
    │  ├── Markdown report (sections, tables, summary)
    │  ├── PDF export (WeasyPrint)
    │  └── History store (SQLite)
    │
    ▼
React Frontend (report viewer + upload panel + history sidebar)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, FastAPI |
| Agent orchestration | LangChain + LangGraph |
| LLM | **Ollama (llama3.2)** (100% Local & Free) |
| Vector DB & Retrieval | ChromaDB (local) + rank-bm25 (Keyword search) |
| Web search | Tavily Search API |
| Document parsing | PyMuPDF, python-docx, LangChain splitters |
| Embeddings | HuggingFace `all-MiniLM-L6-v2` (Local, free) |
| Frontend | React 18 + Vite + TailwindCSS |
| Report rendering | React-Markdown + remark-gfm |
| PDF export | WeasyPrint |
| Database | SQLite (async via aiosqlite) |
| Infrastructure | Docker + Docker Compose |

---

## Project Structure

```text
archon-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app + API routes (including trace endpoints)
│   │   ├── auth.py                  # Authentication endpoints and JWT token management
│   │   ├── trace.py                 # DecisionTrace system for full agent observability
│   │   ├── agent/
│   │   │   ├── orchestrator.py      # LangGraph 6-node graph with conditional review loops
│   │   │   ├── multi_agent_coordinator.py # Coordinator and query router logic
│   │   │   ├── memory_agent.py      # Stateful memory node for LLM agents
│   │   │   ├── tools.py             # web_search + hybrid rag_search
│   │   │   └── prompts.py           # Planner, Researcher, Validator, Summarizer, Writer, Reviewer prompts
│   │   ├── rag/
│   │   │   ├── ingest.py            # Document parsing + ChromaDB ingest
│   │   │   ├── retriever.py         # Hybrid search (Rank-BM25 Keyword + Semantic ChromaDB)
│   │   │   └── embeddings.py        # Embedding model config
│   │   ├── evaluation/
│   │   │   └── metrics.py           # RAGAS-style metrics (Faithfulness, Relevance, Coverage)
│   │   ├── output/
│   │   │   ├── formatter.py         # Markdown structuring and extraction
│   │   │   └── pdf_export.py        # Markdown to PDF export
│   │   ├── memory/
│   │   │   └── store.py             # In-memory history for contextual multi-turn
│   │   └── db/
│   │       └── models.py            # SQLite queries + agent metadata persistence
│   ├── requirements.txt
│   └── Dockerfile
├── data/                            # Auto-created via docker volume (SQLite + Chroma DB)
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                  # Main layout and routing logic
│   │   ├── index.css                # Tailwind base + Custom styles (metric bars, timeline)
│   │   ├── api/
│   │   │   ├── client.js            # Axios client with getTrace implementation
│   │   │   └── auth.js              # Authentication hooks
│   │   ├── components/              # UI components (QueryInput, ReportViewer, UploadPanel, etc.)
│   │   ├── context/                 # React Contexts (AuthContext, ToastContext)
│   │   ├── layouts/                 # Page Layouts (AppLayout, AuthLayout)
│   │   └── pages/                   # All routed views (Login, Register, Research, Settings, etc.)
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── Dockerfile                       # Multi-stage or alternate build file
├── .env                             # Your environment variables
├── .env.example                     # Environment variable template
├── .gitignore
└── README.md
```

---

## End-to-End Setup Instructions

### Step 1 — Install and Configure Ollama (Local LLM)
Since this project uses 100% local AI models to bypass rate limits, you must run Ollama on your host machine.

1. Install Ollama:
   - **Mac/Linux**: `brew install ollama` (or download from [ollama.com](https://ollama.com))
   - **Windows**: Download the installer from ollama.com
2. Start the Ollama background service:
   - `ollama serve`
3. Download the Llama 3.2 model:
   - `ollama pull llama3.2`

### Step 2 — Configure API Keys (`.env`)
You only need an API key for the Web Search capability.

1. Go to https://app.tavily.com, sign up for a free account, and copy your API Key.
2. In the root of the project, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill it in:
   ```env
   TAVILY_API_KEY="tvly-your-tavily-api-key"
   
   # Note: For Docker, host.docker.internal allows the backend container to reach Ollama on the host machine.
   OLLAMA_BASE_URL="http://host.docker.internal:11434"
   ```

### Step 3 — Run the Full Stack via Docker

You don't need to manually install Python or Node! Docker handles it all.

```bash
docker compose up --build
```

**Port Numbers:**
- 👉 **Frontend UI**: [http://localhost:5173](http://localhost:5173) (Open this in your browser!)
- **Backend API**: http://localhost:8000
- **Interactive API docs**: http://localhost:8000/docs
- **Ollama Engine**: http://localhost:11434

*Note: You must access the application via port **5173**. Accessing port 8000 in your browser will result in a raw JSON "Not Found" message since it's an API server.*

---

## How to Use

1. **Create an account** — Go to `http://localhost:5173/register` and make an account (data is stored locally in SQLite).
2. **Submit a query** — Type your research question in the text box and press "Research →"
3. **Wait for the pipeline** — The local Llama 3.2 model will systematically plan, research, validate, summarize, and write the report. *(Note: Because local models run on your CPU/GPU, a full 6-agent report generation will take about 1-2 minutes depending on your hardware).*
4. **Browse history** — Past queries appear in the left sidebar; click any to reload.
5. **Upload documents** — Use the right panel to upload PDFs or DOCX files; they get chunked and indexed into ChromaDB for RAG.
6. **Export PDF** — Click "↓ Export PDF" above any completed report to download it.

---

## Agent Pipeline Details

### LangGraph Orchestrator (`agent/orchestrator.py`)

A 6-node stateful multi-agent system with conditional routing:

```text
planner → researcher → validator → summarizer → report_writer → reviewer
                ↑                                                    |
                └──────── (if review_score < 7, loop back) ─────────┘
```

- **planner**: Breaks the query into targeted sub-queries.
- **researcher**: Rewrites queries and runs hybrid retrieval (BM25 + Semantic search).
- **validator**: Scores the retrieved sources for relevance, credibility, and recency.
- **summarizer**: Produces a structured bullet-point summary from raw context.
- **report_writer**: Expands the summary into the final formatted report.
- **reviewer**: Critiques the report. If the score is < 7, it triggers a retry loop back to the researcher (max 2 loops).

---

## Evaluation Metrics

The system uses lightweight, RAGAS-style evaluation metrics (without external dependencies) to measure report quality:

- **Faithfulness**: Measures what fraction of the report's claims are grounded in retrieved sources (hallucination detection).
- **Answer Relevance**: Evaluates whether the report directly addresses the original user query.
- **Source Coverage**: Measures how many of the planner's sub-queries were addressed in the final report.

Scores are displayed on the frontend upon report completion.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Authenticate and retrieve JWT token |
| `GET`  | `/api/auth/me` | Validate token and retrieve user info |
| `POST` | `/api/query` | Submit a research query (runs in background) |
| `GET` | `/api/report/{id}` | Poll for report status and content |
| `GET` | `/api/report/{id}/pdf` | Download completed report as a styled PDF |
| `GET` | `/api/report/{id}/trace` | Get full execution trace of the 6-agent pipeline |
| `GET` | `/api/report/{id}/stream` | Server-Sent Events stream for live agent progress |
| `GET` | `/api/history` | List all past queries with summaries |
| `DELETE` | `/api/history/{id}` | Delete a past query |
| `POST` | `/api/upload` | Upload a PDF or DOCX for RAG indexing |
| `GET` | `/api/documents` | List all uploaded and indexed documents |

---

## Dependencies (Backend)

```text
fastapi>=0.111.0
uvicorn>=0.30.0
langchain>=0.2.0
langgraph>=0.1.5
chromadb>=0.5.0
tavily-python>=0.3.3
pymupdf>=1.25.0
python-docx>=1.1.2
weasyprint>=60.0
sqlalchemy>=2.0.30
aiosqlite>=0.20.0
sentence-transformers>=2.7.0
passlib[bcrypt]>=1.7.4
python-jose[cryptography]>=3.3.0
```
