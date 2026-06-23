from dotenv import load_dotenv
import os

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"

EMBED_MODEL = "nomic-embed-text"

CHROMA_PATH = "data/chroma"
COLLECTION_NAME = "documents"

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
TOP_K = 5