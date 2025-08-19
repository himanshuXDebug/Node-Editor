from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import defaultdict, deque
from dotenv import load_dotenv
import google.generativeai as genai
import os

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.post("/api/gemini")
async def generate_with_gemini(payload: PromptPayload):
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        result = model.generate_content(payload.prompt)

        output = getattr(result, "text", None)
        if not output and hasattr(result, "response"):
            output = result.response.text()
        cleaned = output.strip().lstrip("Answer:").replace("*", "").replace("**", "")
        print(cleaned)
        return {"output": cleaned or "Gemini returned no usable text."}
    except Exception as e:
        return {"error": str(e)}

