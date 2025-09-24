# ⚡ Workflow automation platform 

**Project Status:** Preview or testing phase completed  
Some features may not work properly or may not meet your expectations yet. Stay tuned for updates!  

---

## ✨ Features (Current)

- **Abstracted Node System** using `NodeBase`  
- **5 Unique Node Types**:
  - Input  
  - Output  
  - Gemini  
  - Text  
  - Condition 
    
- **Modern UI/UX** styling across all components  
- **Dynamic TextNode** with textarea + input handles  
- **FastAPI Backend Integration** for pipeline validation

## Production vs Development Nodes

- All development nodes will not be available in the production link provided below.

- If a user requires access to a specific development node (or multiple), they can submit a request from the Report Section of the live project.

- Requests must include a valid reason for enabling the node(s).

- If the request is approved, the user will be notified, and our team will temporarily enable the requested node(s) in production for up to 7 days.

- After that period, the development nodes will be removed again to keep the production environment stable.


---
&nbsp;

# 🔹 Live Demo & Production Links

- #### Here you can find links to both production and live demo environments and also Usage Guide.

## 🌐 Live Demo

- Development Preview: [https://preview-project.com](https://frontend-node-visual-editor.vercel.app/)

- Production: [https://project.com](https://visual-node-editor.up.railway.app/)


&nbsp;

## Usage Guide

Step-by-step example of how to create a simple workflow.


### Example Workflow ( In Production )
``` bash
1. Drag an **Input Node**.

2. Connect it to a **Condition Node** (Condition: starts with "Write").

3. Connect Condition → LLM Node.

4. Connect LLM → Output Node.

5. Click **Run** and test in the Run Panel.
```

###  Note -  Make sure Condition is on in LLM Node and declare the same variable from Condition Node.
---

### 🔹 Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   npm start

2. This starts the development server (default: http://localhost:3000)

### 🔹 Backend Setup

1. Navigate to the backend directory:

    ```bash
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload
    

2. This starts the FastAPI server (default: http://localhost:8000)

## Available endpoints:

- **POST /pipelines/parse → Analyze & validate pipelines**

- **Submitting a Pipeline**

- **Build your pipeline visually using nodes and edges**

- **The system calls POST /pipelines/parse, returning:**

- **Number of nodes**

- **Number of edges**

- **Whether pipeline is a DAG (Directed Acyclic Graph)**

## Tech Stack

- Frontend: React + TypeScript + React Flow (for DAG visualization)

- Backend: FastAPI (Python)

- Communication: REST APIs
