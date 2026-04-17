# AI Research Assistant

A production-grade AI research tool that takes a natural language query, searches the web and your own documents, reasons over the results, and produces a structured, exportable report — powered by Claude (Anthropic), RAG, and a LangGraph agentic orchestration loop.

---

## What It Does

Give it a query like:

> "Analyze AI adoption trends in fintech for 2024–2025 and give me a structured report"

It will:
1. Break the query into sub-tasks (planner node)
2. Search the web for current information (via Tavily)
3. Search your uploaded documents (via RAG + ChromaDB)
4. Reason over retrieved context using Claude
5. Produce a structured report with sections, tables, and a summary
6. Let you export the report as a PDF

---

## Architecture Overview

```
User Query
    │
    ▼
Orchestrator Agent (LangGraph)
    │  ├── RAG Tool        → ChromaDB vector search (your docs)
    │  ├── Web Search Tool → Tavily Search API (live web)
    │  └── LLM Reasoning  → Claude (claude-sonnet-4-20250514)
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
| LLM | Claude API (`claude-sonnet-4-20250514`) |
| Vector DB | ChromaDB (local, persisted to disk) |
| Web search | Tavily Search API |
| Document parsing | PyMuPDF, python-docx, LangChain splitters |
| Embeddings | OpenAI `text-embedding-3-small` (optional) or HuggingFace `all-MiniLM-L6-v2` (free, local fallback) |
| Frontend | React 18 + Vite + TailwindCSS |
| Report rendering | React-Markdown + remark-gfm |
| PDF export | WeasyPrint |
| Database | SQLite (async via aiosqlite) |
| Infrastructure | Docker + Docker Compose |

---

## Project Structure

```
research-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app + CORS + all routes
│   │   ├── agent/
│   │   │   ├── orchestrator.py      # LangGraph graph: planner → researcher → synthesizer
│   │   │   ├── tools.py             # web_search (Tavily) + rag_search (ChromaDB)
│   │   │   └── prompts.py           # System prompts + report structure template
│   │   ├── rag/
│   │   │   ├── ingest.py            # Load PDF/DOCX → chunk → embed → store in ChromaDB
│   │   │   ├── retriever.py         # Similarity search over ChromaDB
│   │   │   └── embeddings.py        # Embedding model config (OpenAI or HuggingFace)
│   │   ├── output/
│   │   │   ├── formatter.py         # Report header, summary extraction, metadata
│   │   │   └── pdf_export.py        # Markdown → styled HTML → PDF via WeasyPrint
│   │   ├── memory/
│   │   │   └── store.py             # In-process session memory (last N queries)
│   │   └── db/
│   │       └── models.py            # SQLAlchemy async models + CRUD helpers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                  # Root layout: sidebar + main + upload panel
│   │   ├── index.css                # All custom styles + CSS variables
│   │   ├── components/
│   │   │   ├── QueryInput.jsx       # Query textarea + submit button
│   │   │   ├── ReportViewer.jsx     # Markdown report renderer + PDF export link
│   │   │   ├── UploadPanel.jsx      # File upload + indexed documents list
│   │   │   └── HistorySidebar.jsx   # Past queries with status + delete
│   │   └── api/
│   │       └── client.js            # Axios wrapper for all backend API calls
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env                             # Your actual keys — DO NOT commit to git
├── .env.example                     # Template with placeholder values
└── README.md
```

---

## API Keys Setup

This project requires **2 mandatory keys** and 1 optional key.

### Step 1 — Create your `.env` file

In the root of the project (same folder as `docker-compose.yml`):

```bash
cp .env.example .env
```

Then open `.env` in any text editor and fill in your keys:

```env
ANTHROPIC_API_KEY="YOUR_ANTHROPIC_KEY"        
TAVILY_API_KEY="YOUR_TAVILY_KEY"             
CHROMA_PERSIST_DIR=./data/chroma    
SQLITE_DB_PATH=./data/history.db    
OPENAI_API_KEY="YOUR_OPENAI_KEY"                     
```

### Step 2 — Get your keys

**Anthropic API Key** (required — for Claude LLM)
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Click **API Keys** in the left sidebar
4. Click **Create Key**, give it a name, copy it
5. Paste as `ANTHROPIC_API_KEY=sk-ant-...` in your `.env`

**Tavily API Key** (required — for web search)
1. Go to https://app.tavily.com
2. Sign up (free tier: 1,000 searches/month)
3. Your API key is shown on the dashboard homepage
4. Paste as `TAVILY_API_KEY=tvly-...` in your `.env`

**OpenAI API Key** (optional — for embeddings only)
- If set: uses `text-embedding-3-small` (paid, higher quality)
- If blank: automatically falls back to `all-MiniLM-L6-v2` (free, runs locally)
- Get one at: https://platform.openai.com/api-keys


---

## Setup & Running

### Option A — Docker (recommended, no Python/Node setup needed)

```bash
# 1. Clone the repo
git clone https://github.com/shanmukhraj7/research-assistant
cd research-assistant

# 2. Create and fill in your .env
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY and TAVILY_API_KEY

# 3. Start everything
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Interactive API docs: http://localhost:8000/docs

### Option B — Run locally (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend** (in a separate terminal):
```bash
cd frontend
npm install
npm run dev
```

---

## How to Use

1. **Submit a query** — Type your research question in the text box and press "Research →" (or Cmd+Enter)
2. **Wait for the report** — The agent searches the web and your documents, then synthesizes a structured report (takes 15–60 seconds)
3. **Browse history** — Past queries appear in the left sidebar with status indicators; click any to reload
4. **Upload documents** — Use the right panel to upload PDFs or DOCX files; they get chunked and indexed into ChromaDB for RAG
5. **Export PDF** — Click "↓ Export PDF" above any completed report to download it

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/query` | Submit a research query (returns `id` immediately, runs in background) |
| `GET` | `/api/report/{id}` | Poll for report status and content |
| `GET` | `/api/report/{id}/pdf` | Download completed report as a styled PDF |
| `GET` | `/api/history` | List all past queries with summaries |
| `DELETE` | `/api/history/{id}` | Delete a past query |
| `POST` | `/api/upload` | Upload a PDF or DOCX for RAG indexing |
| `GET` | `/api/documents` | List all uploaded and indexed documents |
| `GET` | `/health` | Health check |

---

## Agent Pipeline Details

### LangGraph Orchestrator (`agent/orchestrator.py`)

Three-node stateful graph:

```
planner → researcher → synthesizer → END
```

- **planner**: Calls Claude to break the query into 3–5 targeted sub-queries (returns JSON array)
- **researcher**: Runs `multi_query_web_search` + `multi_query_rag_search` in parallel across all sub-queries, deduplicates results
- **synthesizer**: Calls Claude with all gathered context + enforced report template to write the final structured report

### RAG Pipeline (`rag/ingest.py` + `rag/retriever.py`)

- Supports PDF (via PyMuPDF) and DOCX (via python-docx)
- Chunks with `RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)`
- Embeds with OpenAI or HuggingFace and stores in ChromaDB (persisted to `./data/chroma`)
- Retrieval: top-k cosine similarity search, deduplicated across multiple sub-queries

### Session Memory (`memory/store.py`)

- Keeps last 10 query/report pairs in memory (process lifetime)
- Injects last 3 as context into new queries so Claude can build on prior research

### Report Format (enforced via prompt)

```markdown
## Executive Summary
## Key Findings      ← includes a markdown table
## Detailed Analysis
### Sub-topic 1
### Sub-topic 2
## Conclusions & Recommendations
## Sources
```

---

## Dependencies

```
fastapi==0.111.0
uvicorn==0.30.1
langchain==0.2.0
langchain-community==0.2.0
langchain-openai==0.1.8
langgraph==0.1.5
anthropic==0.28.0
chromadb==0.5.0
tavily-python==0.3.3
pymupdf==1.24.5
python-docx==1.1.2
weasyprint==62.1
pydantic==2.7.0
python-multipart==0.0.9
sqlalchemy==2.0.30
aiosqlite==0.20.0
python-dotenv==1.0.1
httpx==0.27.0
markdown
```

