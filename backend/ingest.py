import fitz
import docx
import csv
import io
from langchain_text_splitters import RecursiveCharacterTextSplitter
import ollama
import chromadb
from config import CHROMA_PATH, COLLECTION_NAME, CHUNK_SIZE, CHUNK_OVERLAP, EMBED_MODEL
from vectorstore import get_collection

def parse_file(file_bytes: bytes, filename: str) -> list[dict]:
    ext = filename.rsplit('.', 1)[-1].lower()

    if ext == 'pdf':
        return extract_pdf(file_bytes)
    elif ext == 'docx':
        return extract_docx(file_bytes)
    elif ext in ('txt', 'md'):
        return extract_plaintext(file_bytes)
    elif ext == 'csv':
        return extract_csv(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

def extract_pdf(file_bytes: bytes) -> list[dict]:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text().strip()
        if text:
            pages.append({"text": text, "page": i + 1})
    return pages

def extract_docx(file_bytes: bytes) -> list[dict]:
    doc = docx.Document(io.BytesIO(file_bytes))
    full_text = '\n'.join(p.text for p in doc.paragraphs if p.text.strip())
    return [{"text": full_text, "page": 1}]

def extract_plaintext(file_bytes: bytes) -> list[dict]:
    text = file_bytes.decode('utf-8', errors='ignore').strip()
    return [{"text": text, "page": 1}]

def extract_csv(file_bytes: bytes) -> list[dict]:
    text = file_bytes.decode('utf-8', errors='ignore')
    reader = csv.reader(io.StringIO(text))
    rows = [', '.join(row) for row in reader if any(row)]
    return [{"text": '\n'.join(rows), "page": 1}]

def chunk_pages(pages: list[dict]) -> list[dict]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    chunks = []
    for page in pages:
        splits = splitter.split_text(page["text"])
        for split in splits:
            chunks.append({"text": split, "page": page["page"]})
    return chunks

def embed_text(text: str) -> list[float]:
    response = ollama.embeddings(model=EMBED_MODEL, prompt=text)
    return response["embedding"]

def ingest_file(file_bytes: bytes, filename: str) -> int:
    collection = get_collection()
    pages = parse_file(file_bytes, filename)
    chunks = chunk_pages(pages)

    for i, chunk in enumerate(chunks):
        embedding = embed_text(chunk["text"])
        collection.add(
            ids=[f"{filename}_{i}"],
            embeddings=[embedding],
            documents=[chunk["text"]],
            metadatas=[{"source": filename, "page": chunk["page"]}]
        )

    return len(chunks)