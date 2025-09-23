from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import defaultdict, deque
from dotenv import load_dotenv
import google.generativeai as genai
import os
from typing import Optional

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def read_root():
    return {"Ping": "Pong"}

@app.post("/pipelines/parse")
async def parse_pipeline(request: Request):
    data = await request.json()
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    num_nodes = len(nodes)
    num_edges = len(edges)
    graph = defaultdict(list)
    indegree = defaultdict(int)
    
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        if source and target:
            graph[source].append(target)
            indegree[target] += 1
    
    queue = deque([node["id"] for node in nodes if indegree[node["id"]] == 0])
    visited = 0
    
    while queue:
        node = queue.popleft()
        visited += 1
        for neighbor in graph[node]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)
    
    is_dag = visited == len(nodes)
    return {
        "num_nodes": num_nodes,
        "num_edges": num_edges,
        "is_dag": is_dag
    }

class PromptPayload(BaseModel):
    prompt: str
    personalApiKey: Optional[str] = None
    model: Optional[str] = "gemini-2.5-flash"

@app.post("/api/gemini")
async def generate_with_gemini(payload: PromptPayload):
    try:
        if payload.personalApiKey and payload.personalApiKey.strip():
            api_key = payload.personalApiKey.strip()
            if len(api_key) < 30 or not api_key.startswith("AIza"):
                raise HTTPException(status_code=400, detail={"error": {"message": "Invalid API key format"}})
        else:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise HTTPException(status_code=500, detail={"error": {"message": "API key not configured"}})

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(payload.model or "gemini-2.5-flash")
        result = model.generate_content(payload.prompt)

        output = result.text
        cleaned = output.strip().lstrip("Answer:").replace("*", "").replace("**", "")
        
        return {
            "output": cleaned or "No response generated", 
            "apiKeySource": "personal" if payload.personalApiKey else "backend"
        }

    except HTTPException:
        raise
    except Exception as e:
        if "API_KEY_INVALID" in str(e) or "invalid api key" in str(e).lower():
            if payload.personalApiKey:
                raise HTTPException(status_code=401, detail={"error": {"message": "Personal API key invalid"}})
            else:
                raise HTTPException(status_code=500, detail={"error": {"message": "System API key error"}})
        
        raise HTTPException(status_code=500, detail={"error": {"message": f"Processing error: {str(e)}"}})

@app.exception_handler(422)
async def validation_exception_handler(request: Request, exc):
    return {"error": {"message": "Request validation failed", "details": str(exc)}}
