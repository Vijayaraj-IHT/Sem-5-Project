"""
LexGuard Dedicated AI Microservice (lexguard-ai-service).
Decouples heavy machine learning models (InLegalBERT, multilingual-e5, Qwen2.5)
from the main FastAPI backend.
"""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from ai_service.config import ai_settings
from ai_service.schemas import (
    NERRequest, NERResponse,
    EmbedRequest, EmbedResponse,
    SummarizeRequest, SummarizeResponse,
    RatioRequest, RatioResponse,
    GapAnalysisRequest, GapAnalysisResponse,
)
from ai_service.models import (
    ner_engine,
    embedding_engine,
    summarization_engine,
    ratio_engine,
    gap_engine,
)

app = FastAPI(
    title="LexGuard AI Microservice",
    description="Dedicated legal intelligence microservice for InLegalBERT NER, multilingual embeddings, and ratio extraction.",
    version="1.0.0",
)

# Cross-Origin Resource Sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Health check for AI microservice."""
    return {
        "status": "healthy",
        "service": "lexguard-ai-service",
        "version": "1.0.0",
        "models": {
            "ner": ai_settings.NER_MODEL,
            "embeddings": ai_settings.EMBEDDING_MODEL,
            "llm": ai_settings.LLM_MODEL,
        },
        "device": ai_settings.DEVICE,
        "mock_mode": ai_settings.USE_MOCK_AI,
    }


@app.post("/ner", response_model=NERResponse, status_code=status.HTTP_200_OK)
def extract_ner(req: NERRequest):
    """
    Extracts legal entities, acts, sections, parties, and judges from text.
    """
    return ner_engine.extract_entities(text=req.text, court_context=req.court_context)


@app.post("/embed", response_model=EmbedResponse, status_code=status.HTTP_200_OK)
def generate_embeddings(req: EmbedRequest):
    """
    Generates dense vector embeddings for input legal text chunks.
    """
    return embedding_engine.embed_texts(texts=req.texts)


@app.post("/summarize", response_model=SummarizeResponse, status_code=status.HTTP_200_OK)
def summarize_judgment(req: SummarizeRequest):
    """
    Synthesizes a 2-3 sentence legal executive abstract.
    """
    return summarization_engine.summarize(
        text=req.text,
        max_sentences=req.max_sentences,
        court=req.court,
        case_no=req.case_no,
    )


@app.post("/extract-ratio", response_model=RatioResponse, status_code=status.HTTP_200_OK)
def extract_ratio_decidendi(req: RatioRequest):
    """
    Extracts the binding ratio decidendi and core legal proposition.
    """
    return ratio_engine.extract_ratio(
        text=req.text,
        prayer=req.prayer,
        outcome=req.outcome,
        acts_cited=req.acts_cited,
    )


@app.post("/analyze-gap", response_model=GapAnalysisResponse, status_code=status.HTTP_200_OK)
def analyze_draft_gap(req: GapAnalysisRequest):
    """
    Compares draft petition against precedent standards and identifies missing legal elements.
    """
    return gap_engine.analyze_gap(
        draft_text=req.draft_text,
        precedents=req.precedents,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=ai_settings.HOST, port=ai_settings.PORT)
