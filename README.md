# Lexguard — Legal Case Research & Cryptographic Verification Platform

Lexguard is a judicial research platform combining AI-assisted draft petition gap analysis with tamper-evident cryptographic document verification.

---

## 🏛️ Architecture Overview

Lexguard provides a zero-trust legal repository architecture:
- **Cryptographic Document Ingestion**: Every case judgment uploaded undergoes real-time SHA-256 byte hashing, duplicate detection, and automated UUID path traversal defense.
- **Tamper-Evident Merkle & Hash-Chained Audit Trail**: Administrative actions (approvals, rejections, views, integrity checks) are logged into an immutable SHA-256 hash-chained ledger that can be mathematically verified in real-time.
- **Anti-Hallucination AI Precedent Matching**: Petition drafts are analyzed against published judgments in the repository using Hugging Face models (`Qwen/Qwen2.5`, `InLegalBERT`, `all-MiniLM-L6-v2`), ensuring citations reference verified court records.
- **Role-Based Access Control (RBAC)**: Secure access tailored for Senior Staff, Junior Staff, Advocates, Scholars, and the General Public.

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** (Python 3.11+)
- **SQLAlchemy** ORM (SQLite / PostgreSQL with pgvector)
- **Hugging Face Transformers** & Sentence Transformers
- **Pydantic v2** for schema validation and cryptographic guarantees
- **HTTP-Only Cookies** and **Double-Submit CSRF Protection**

### Frontend
- **React 18+** / **Vite**
- **Tailwind CSS** (Judicial Navy & Slate Theme)
- **React Router DOM v6/v7**
- **Axios** with automatic cookie and CSRF token handling
- **Lucide React** judicial iconography

---

## 🚀 Getting Started

### 1. Environment Setup

Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173` and proxy requests to `/api/v1` on port 8000.

---

## 📁 Repository Structure
```
Lexguard/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/ # Admin, Auth, Cases, Draft, Search
│   │   ├── core/            # Config, Database, Security & Crypto
│   │   ├── models/          # SQLAlchemy Database Models
│   │   ├── schemas/         # Pydantic Schemas
│   │   └── services/        # AI & Cryptographic Services
├── frontend/
│   ├── src/
│   │   ├── api/             # API client & endpoint bindings
│   │   ├── components/      # Common & Layout UI components
│   │   ├── context/         # AuthContext & Session management
│   │   └── pages/           # AdminDashboard, DraftAssistant, Bookmarks, Upload
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔒 Security Audit & Privacy
- Zero credential exposure in Git version control.
- All session access tokens reside strictly within `HttpOnly`, `SameSite=Lax` cookies.
- CSRF tokens are verified on all state-modifying endpoints (`POST`, `PUT`, `DELETE`, `PATCH`).
