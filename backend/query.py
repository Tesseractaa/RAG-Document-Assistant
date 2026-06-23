import ollama
import chromadb
from groq import Groq
from config import EMBED_MODEL, GROQ_API_KEY, GROQ_MODEL, TOP_K
from vectorstore import get_collection

def retrieve(question: str) -> list[dict]:
    collection = get_collection()
    embedding = ollama.embeddings(model=EMBED_MODEL, prompt=question)["embedding"]
    results = collection.query(
        query_embeddings=[embedding],
        n_results=TOP_K,
        include=["documents", "metadatas", "distances"],
    )
    chunks = []
    for i in range(len(results["documents"][0])):
        chunks.append({
            "text": results["documents"][0][i],
            "source": results["metadatas"][0][i]["source"],
            "page": results["metadatas"][0][i]["page"],
            "distance": results["distances"][0][i]
        })
    return chunks

def build_prompt(question: str, chunks: list[dict]) -> str:
    context = ""
    for i, chunk in enumerate(chunks):
        context += f"[{i+1}] (source: {chunk['source']}, page {chunk['page']})\n{chunk['text']}\n\n"
    return f"""Answer the question using only the context below.
For every claim you make, cite the source using [1], [2], etc.
If the answer isn't in the context, say so.

Context:
{context}
Question: {question}"""

def answer(question: str) -> dict:
    chunks = retrieve(question)
    prompt = build_prompt(question, chunks)
    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    answer_text = response.choices[0].message.content
    citations = [
        {"index": i + 1, "source": c["source"], "page": c["page"]}
        for i, c in enumerate(chunks)
    ]
    return {"answer": answer_text, "citations": citations}