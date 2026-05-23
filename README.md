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
| Frontend | React 18 + React Router + Vite + TailwindCSS |
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
│   │   ├── auth.py                  # Authentication logic and JWT handling
│   │   ├── trace.py                 # DecisionTrace system for full agent observability
│   │   ├── agent/
│   │   │   ├── orchestrator.py      # LangGraph 6-node graph with conditional review loops
│   │   │   ├── multi_agent_coordinator.py # Coordinator for multi-agent workflows
│   │   │   ├── memory_agent.py      # Agent responsible for memory handling
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
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                  # Main layout and routing setup
│   │   ├── index.css                # Tailwind base + Custom styles
│   │   ├── api/
│   │   │   ├── client.js            # Axios client with interceptors
│   │   │   └── auth.js              # API endpoints for authentication
│   │   ├── components/
│   │   │   ├── QueryInput.jsx
│   │   │   ├── ReportViewer.jsx     # Markdown renderer + RAGAS metric display
│   │   │   ├── UploadPanel.jsx
│   │   │   └── HistorySidebar.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # React context for global auth state
│   │   │   └── ToastContext.jsx     # React context for toast notifications
│   │   ├── layouts/
│   │   │   ├── AppLayout.jsx        # Layout for authenticated app pages
│   │   │   └── AuthLayout.jsx       # Layout for auth pages (login/register)
│   │   └── pages/                   # Application views/pages
│   │       ├── AnalysisPage.jsx
│   │       ├── ArchivesPage.jsx
│   │       ├── DraftsPage.jsx
│   │       ├── HelpPage.jsx
│   │       ├── HistoryPage.jsx
│   │       ├── LoginPage.jsx
│   │       ├── LogoutPage.jsx
│   │       ├── NotFoundPage.jsx
│   │       ├── NotificationsPage.jsx
│   │       ├── ProfilePage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── ResearchPage.jsx
│   │       ├── SettingsPage.jsx
│   │       └── SynthesisPage.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env                             # Your environment variables
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
   CHROMA_PERSIST_DIR="./data/chroma"
   SQLITE_DB_PATH="./data/history.db"
   
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
2. **Submit a query** — From the **Research** page, type your research question in the text box and press "Research →"
3. **Wait for the pipeline** — The multi-agent system will systematically plan, research, validate, summarize, and write the report. *(Note: Because local models run on your CPU/GPU, a full 6-agent report generation will take about 1-2 minutes depending on your hardware).*
4. **Browse history** — Use the **History** and **Archives** pages to view past queries, or check the **Drafts** page for ongoing work.
5. **Analyze & Synthesize** — Use the dedicated **Analysis** and **Synthesis** pages to drill down into specific agent outputs and metrics.
6. **Upload documents** — Upload PDFs or DOCX files for RAG indexing; they get chunked and indexed into ChromaDB.
7. **Export PDF** — Export any completed report as a formatted PDF document.
8. **Manage Profile** — Update your preferences and notifications from the **Profile** and **Settings** pages.

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

### Multi-Agent Coordinator & Memory

The system includes advanced coordination and memory layers to support the primary orchestrator:

- **Memory Agent (`agent/memory_agent.py`)**: Handles episodic and semantic memory storage/retrieval across sessions.
- **Multi-Agent Coordinator (`agent/multi_agent_coordinator.py`)**: Responsible for query routing (directing queries to specialized agents), agent health monitoring, and tracking agent capabilities and performance metrics.

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
| `GET` | `/api/agents/status` | Get current status of all running agents |
| `GET` | `/api/agents/capabilities` | List capabilities of the multi-agent system |
| `GET` | `/api/agents/health` | Health check specifically for agent services |

---

## Dependencies (Backend)

```text
fastapi>=0.111.0
uvicorn>=0.30.0
langchain>=0.2.0
langchain-community>=0.2.0
langgraph>=0.1.5
chromadb>=0.5.0
tavily-python>=0.3.3
pymupdf>=1.25.0
python-docx>=1.1.2
weasyprint>=60.0
pydantic>=2.7.0
python-multipart>=0.0.9
sqlalchemy>=2.0.30
aiosqlite>=0.20.0
python-dotenv>=1.0.1
httpx>=0.27.0
markdown>=3.6
groq>=0.9.0
google-generativeai>=0.7.2
rank-bm25>=0.2.2
sentence-transformers>=2.7.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
```
