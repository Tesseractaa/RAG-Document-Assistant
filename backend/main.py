from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ingest import ingest_file
from query import answer as run_query

app = FastAPI(title="AI Knowledge Assistant")

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt', 'md', 'csv'}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str
    citations: list[dict]

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/ingest")
async def ingest(file: UploadFile = File(...)):
    ext = file.filename.rsplit('.', 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
    file_bytes = await file.read()
    chunk_count = ingest_file(file_bytes, file.filename)
    return {
        "filename": file.filename,
        "status": "ingested",
        "chunks": chunk_count
    }

@app.post("/query", response_model=QueryResponse)
async def query(body: QueryRequest):
    result = run_query(body.question)
    return result

@app.post("/reset")
async def reset():
    from vectorstore import get_collection
    import chromadb
    client = chromadb.PersistentClient(path="data/chroma")
    client.delete_collection("documents")
    return {"status": "reset"}