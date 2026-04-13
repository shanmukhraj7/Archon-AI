#  AI Research Assistant

A company-grade AI research tool that takes a natural language query, searches the web and your own documents, reasons over the results, and produces a structured, exportable report — powered by LLMs, RAG, and an agentic orchestration loop.

---
## What It Does

Give it a query like:

> "Analyze AI adoption trends in fintech for 2024–2025 and give me a structured report"

It will:
1. Break the query into sub-tasks
2. Search the web for current information (via Tavily)
3. Search your uploaded documents (via RAG + ChromaDB)
4. Reason over retrieved context using an LLM
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
    │  └── LLM Reasoning  → Claude / GPT-4
    │
    ▼
Structured Output Engine
    │  ├── Markdown report (sections, tables, summary)
    │  ├── PDF export
    │  └── History store (SQLite)
    │
    ▼
React Frontend (report viewer + upload panel)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, FastAPI |
| Agent orchestration | LangChain + LangGraph |
| LLM | Claude API (claude-3-5-sonnet) or OpenAI GPT-4 |
| Vector DB | ChromaDB (local) |
| Web search | Tavily Search API |
| Document parsing | PyMuPDF, python-docx, LangChain splitters |
| Embeddings | OpenAI text-embedding-3-small or HuggingFace (free) |
| Frontend | React + Vite + TailwindCSS |
| Report rendering | React-Markdown + remark-gfm |
| PDF export | WeasyPrint or FPDF2 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Infrastructure | Docker + Docker Compose |

---

## Project Structure

```
research-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app + CORS + routes
│   │   ├── agent/
│   │   │   ├── orchestrator.py      # LangGraph agent graph definition
│   │   │   ├── tools.py             # Tool definitions: search, RAG, summarize
│   │   │   └── prompts.py           # System prompts + output templates
│   │   ├── rag/
│   │   │   ├── ingest.py            # Chunk + embed documents into ChromaDB
│   │   │   ├── retriever.py         # Similarity search over ChromaDB
│   │   │   └── embeddings.py        # Embedding model config
│   │   ├── output/
│   │   │   ├── formatter.py         # Structured markdown generation
│   │   │   └── pdf_export.py        # HTML → PDF via WeasyPrint
│   │   ├── memory/
│   │   │   └── store.py             # Query history + session memory
│   │   └── db/
│   │       └── models.py            # SQLite schema + CRUD helpers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── QueryInput.jsx       # Query bar + submit
│   │   │   ├── ReportViewer.jsx     # Markdown → rendered report
│   │   │   ├── UploadPanel.jsx      # PDF/doc upload + status
│   │   │   └── HistorySidebar.jsx   # Previous query history
│   │   ├── api/
│   │   │   └── client.js            # Axios wrapper for backend calls
│   │   └── App.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Setup

### 1. Clone and configure

```bash
git clone https://github.com/your-username/research-assistant
cd research-assistant
cp .env.example .env
```

Fill in `.env`:

```env
ANTHROPIC_API_KEY=your_key_here       # or OPENAI_API_KEY
TAVILY_API_KEY=your_key_here
CHROMA_PERSIST_DIR=./data/chroma
SQLITE_DB_PATH=./data/history.db
```

### 2. Run with Docker

```bash
docker-compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs

### 3. Run locally (without Docker)

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

---

## Core Implementation Details

### Agent Orchestrator (`agent/orchestrator.py`)

Uses **LangGraph** to define a stateful agent loop:

```python
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolExecutor

# State: query + retrieved context + steps taken + final report
graph = StateGraph(ResearchState)
graph.add_node("planner", plan_steps)       # Break query into steps
graph.add_node("researcher", run_tools)     # Execute RAG + web search
graph.add_node("synthesizer", synthesize)   # Write structured report
graph.add_edge("planner", "researcher")
graph.add_edge("researcher", "synthesizer")
graph.add_edge("synthesizer", END)
```

### RAG Pipeline (`rag/ingest.py`)

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(loaded_docs)
vectorstore = Chroma.from_documents(chunks, embedding=OpenAIEmbeddings())
```

### Web Search Tool (`agent/tools.py`)

```python
from tavily import TavilyClient

def web_search(query: str) -> list[dict]:
    client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
    results = client.search(query, max_results=5, search_depth="advanced")
    return results["results"]
```

### Structured Output Format

Reports are generated using a strict prompt template:

```
## Executive Summary
[2-3 sentence overview]

## Key Findings
| Finding | Source | Confidence |
|---|---|---|
...

## Detailed Analysis
### [Sub-topic 1]
...

## Sources
...
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/query` | Submit a research query |
| POST | `/api/upload` | Upload PDF or DOCX for RAG |
| GET | `/api/history` | Get query history |
| GET | `/api/report/{id}` | Get a specific report |
| GET | `/api/report/{id}/pdf` | Download report as PDF |
| DELETE | `/api/history/{id}` | Delete a past query |

---

## Phased Build Plan

### Phase 1 — Core Pipeline (Week 1–2)
- FastAPI backend with `/query` endpoint
- Tavily web search integration
- Basic LLM call (no agent loop yet)
- Structured markdown output
- Simple React frontend with query input and report viewer

### Phase 2 — RAG System (Week 3–4)
- PDF/DOCX upload endpoint
- LangChain document loading + chunking
- ChromaDB setup and similarity search
- Combine RAG results with web search in context

### Phase 3 — Agent Loop (Week 5–6)
- LangGraph orchestrator with planner → researcher → synthesizer
- Tool-calling: agent decides when to search web vs RAG
- Iterative refinement (agent can do follow-up searches)
- Error handling and fallbacks

### Phase 4 — Memory + Export (Week 7–8)
- SQLite history store
- Conversation memory (remember previous queries in session)
- PDF export with WeasyPrint
- History sidebar in UI

### Phase 5 — Polish + Deploy (Week 9–10)
- Docker Compose full stack
- Deploy to Railway or Render
- Rate limiting, error messages, loading states
- Optional: authentication with Clerk or Supabase Auth

---

## Learning Path (Learn + Build Simultaneously)

If you are learning and building at the same time, this is the recommended sequence:

**Week 1–2:** Python basics, FastAPI, REST APIs, async/await
- Project milestone: working `/query` endpoint that calls an LLM

**Week 3–4:** LangChain, vector databases, embeddings, RAG
- Project milestone: upload a PDF and ask questions about it

**Week 5–6:** LangGraph, agent architectures, tool use, prompt engineering
- Project milestone: agent that plans multi-step research tasks

**Week 7–8:** React, Vite, TailwindCSS, API calls from frontend
- Project milestone: full UI with query input + rendered report

**Week 9–10:** Docker, environment management, deployment
- Project milestone: live deployed URL

**Total realistic timeline:** 8–12 weeks for a solid v1 if learning on the go. A developer already comfortable with Python and React could ship v1 in 3–4 weeks.

---

## Differentiators vs Typical Student Projects

- Uses **LangGraph** for proper stateful agent loops (not just a linear chain)
- **Multi-source retrieval** — both local docs and live web, merged intelligently
- **Structured output with validation** — report format is enforced via prompts + Pydantic schemas
- **PDF export** — tangible deliverable beyond a chat interface
- **Query history** — basic memory that makes it feel like a real tool

---

## Suggested Improvements (after v1)

- Add citation tracking — every claim linked to its source URL or doc chunk
- Multi-query comparison — "compare X vs Y" runs two research threads and merges
- Streaming output — stream the report token-by-token as it generates
- Scheduled reports — run a query on a cron job and email the report
- Slack/Notion integration — push reports directly to your workspace

---

## Dependencies (`requirements.txt`)

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
```

---

## License

MIT — use it, extend it, ship it.