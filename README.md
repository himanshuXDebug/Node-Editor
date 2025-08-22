# ⚡ Pipeline Builder

**Project Status:** Under Development  
Some features may not work properly or may not meet your expectations yet. Stay tuned for updates!  

---

## ✨ Features (Upcoming & In Progress)

- **Abstracted Node System** using `NodeBase`  
- **9 Unique Node Types**:
  - Input  
  - Output  
  - LLM  
  - Text  
  - Image  
  - Color  
  - Uppercase  
  - Lowercase  
  - Download  
- **Modern UI/UX** styling across all components  
- **Dynamic TextNode** with textarea + input handles  
- **FastAPI Backend Integration** for pipeline validation  
- **Submit Pipeline Button** → Real-time DAG analysis & feedback  

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

- **Click Submit Pipeline**

- **The system calls POST /pipelines/parse, returning:**

- **Number of nodes**

- **Number of edges**

- **Whether pipeline is a DAG (Directed Acyclic Graph)**

## Tech Stack

- Frontend: React + TypeScript + React Flow (for DAG visualization)

- Backend: FastAPI (Python)

- Communication: REST APIs