# Note Script

Note Script is a Retrieval-Augmented Generation (RAG) web application that leverages Gemini AI, Pinecone, Supabase, and a modern React/TypeScript frontend to enable users to upload, view, and chat with their documents. The system is designed for seamless document management, intelligent Q&A, and citation-based navigation.

---

## Table of Contents

- [Note Script](#note-script)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Architecture Overview](#architecture-overview)
  - [Frontend](#frontend)
    - [Key Files](#key-files)
  - [Backend](#backend)
  - [Database \& Storage](#database--storage)
  - [Vector Search (Pinecone)](#vector-search-pinecone)
  - [Authentication](#authentication)
  - [Key Components](#key-components)
    - [Zustand Stores (`src/store.ts`)](#zustand-stores-srcstorets)
    - [Chat Area (`src/components/chat-area.tsx`)](#chat-area-srccomponentschat-areatsx)
    - [PDF Viewer (`src/components/pdf-viewer.tsx`, `PdfViewer.tsx`)](#pdf-viewer-srccomponentspdf-viewertsx-pdfviewertsx)
  - [Data Flow](#data-flow)
  - [Setup \& Development](#setup--development)

---

## Features

- **Document Upload:** Upload PDFs to the system.
- **Document Viewer:** View PDFs with page navigation.
- **Chat with Documents:** Ask questions and receive AI-generated answers with citations.
- **Citation Navigation:** Click citations to jump to the referenced page in the PDF.
- **Persistent State:** User sessions and document states are persisted.
- **Authentication:** Secure access to user documents and chat.

---

## Architecture Overview

- **Client:** React/TypeScript app
- **Server:** Node.js/Express API
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage for PDFs
- **Vector Search:** Pinecone
- **AI Model:** Gemini AI

---

## Frontend

- **Framework:** React with TypeScript
- **State Management:** Zustand (with persistence)
- **UI Components:** Custom components, shadcn/ui, Lucide icons
- **PDF Viewing:** `react-pdf` for rendering and navigation
- **Chat Interface:** Real-time chat with streaming AI responses
- **Citation Handling:** Clickable citations that open the PDF viewer at the correct page

### Key Files

- `src/components/rag-interface.tsx` — Main app shell, manages layout and state
- `src/components/chat-area.tsx` — Chat UI, message streaming, citation handling
- `src/components/pdf-viewer.tsx` & `PdfViewer.tsx` — PDF rendering and navigation
- `src/store.ts` — Zustand stores for auth, file URLs, and UI state

---

## Backend

- **Framework:** Node.js with Express
- **API Endpoints:**
  - `/api/upload` — Handles PDF uploads, stores in Supabase
  - `/api/documents` — Lists user documents
  - `/api/documents/:id/chat` — Handles chat queries, streams AI responses
  - `/api/documents/:id/delete` — Deletes a document
- **AI Integration:** Connects to Gemini AI for RAG-based Q&A
- **Vector Search:** Uses Pinecone to retrieve relevant document chunks for context

---

## Database & Storage

- **Supabase:** Used for authentication, user management, and file storage
  - **Storage:** PDFs are stored in Supabase Storage, organized by user
  - **Auth:** JWT-based authentication for secure API access

---

## Vector Search (Pinecone)

- **Purpose:** Enables semantic search over document contents
- **Workflow:**
  - On upload, PDFs are chunked and embedded
  - Embeddings are stored in Pinecone
  - On chat, relevant chunks are retrieved for context

---

## Authentication

- **Frontend:** Zustand store manages JWT tokens
- **Backend:** All API endpoints require valid JWT tokens
- **Supabase:** Handles user registration, login, and session management

---

## Key Components

### Zustand Stores (`src/store.ts`)

- **Auth Store:** Manages JWT tokens and login/logout
- **File URL Store:** Maps document IDs to Supabase file URLs, tracks active document and file
- **(Optional) Message Store:** For optimistic UI updates in chat

### Chat Area (`src/components/chat-area.tsx`)

- Streams messages from the backend
- Handles optimistic UI for user/AI messages
- Parses citations and enables clickable navigation

### PDF Viewer (`src/components/pdf-viewer.tsx`, `PdfViewer.tsx`)

- Renders PDFs using `react-pdf`
- Allows page navigation and responds to citation clicks

---

## Data Flow

1. **Upload:** User uploads PDF → Sent to backend → Stored in Supabase → Chunks embedded and indexed in Pinecone
2. **Chat:** User asks question → Sent to backend with document ID → Backend retrieves relevant chunks from Pinecone → Sends to Gemini AI → Streams response back to frontend
3. **Citation Click:** User clicks citation → Frontend opens PDF viewer at cited page

---

## Setup & Development

1. **Clone the repository or Extract the ZIP file**
2. **Open in VSCode or your fav editor**
3.
4. **Install dependencies**
   - Frontend: `npm install` in `/frontend`
   - Backend: `npm install` in `/backend`
5. **Configure environment variables**

   - `cd` into `backend` folder and copy `.env.example` to `.env`
   - Add required Supabase keys, Pinecone API key, Gemini AI key, etc.

6. **In `/backend` run `npx prisma migrate` to migrate the schema to supabase**
7. **Start backend:** `npm run dev` in `/backend`
8. **Start frontend:** `npm run dev` in `/frontend`
9. **Access the app at** `http://localhost:5173`
