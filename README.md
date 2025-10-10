# SmartRevise - AI-Powered Revision App

A fully responsive web application designed for Indian Class XI-XII students to master their NCERT coursebooks through intelligent quizzes, AI tutoring, and progress tracking.

## 🎯 Features

- **📚 PDF Viewer**: Upload and view NCERT PDFs with smooth navigation and zoom controls
- **🧠 Smart Quiz Generator**: Generate MCQ, SAQ, and LAQ questions from your coursebooks
- **📊 Progress Tracking**: Monitor accuracy, identify strengths and weaknesses
- **💬 AI Chat Tutor**: Ask questions and get instant help with page citations
- **🎥 Video Recommendations**: Get relevant YouTube study videos based on your content
- **📱 Fully Responsive**: Optimized for all devices - desktop, tablet, and mobile

## 🚀 Getting Started

### Prerequisites
- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Setup Instructions

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm i

# Step 4: Create environment configuration (optional)
# Copy .env.example to .env.local and set your backend URL
# VITE_API_BASE_URL=http://localhost:8000

# Step 5: Start the development server
npm run dev
```

## 📱 Responsive Design Features

The app is fully responsive with adaptive layouts that work seamlessly across all devices:

### Desktop (1280px+)
- Three-column layout with PDF library, main workspace, and progress/videos sidebar
- Full navigation and all features visible simultaneously
- Optimized for productivity with large screen real estate

### Tablet (768px - 1279px)  
- Two-column layout with collapsible sidebars
- Touch-optimized controls
- Adaptive spacing and typography

### Mobile (<768px)
- Single column layout with tab-based navigation
- Hamburger menu for PDF library access
- Progress and videos integrated as tabs in main workspace
- Touch-friendly buttons and controls
- Optimized text sizes and spacing

All components automatically adjust for optimal viewing - no overlapping, clean layouts, and consistent design across all breakpoints.

## 🏗️ Technologies Used

This project is built with:

- **React 18** - Modern UI library
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful and accessible component library
- **React Router** - Client-side routing
- **React Query** - Server state management (ready for backend integration)
- **Recharts** - Data visualization for progress tracking
- **Lucide React** - Icon library
-**n8n** - for rag function to chat with pdf

## 📂 Project Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── workspace/          # Workspace-specific components
│       ├── SourceSelector.tsx
│       ├── PdfViewer.tsx
│       ├── QuizPanel.tsx
│       ├── ChatUI.tsx
│       ├── ProgressMiniDashboard.tsx
│       └── YouTubeRecommender.tsx
├── pages/
│   ├── Home.tsx           # Landing page
│   ├── Workspace.tsx      # Main workspace
│   ├── History.tsx        # Quiz history
│   └── Settings.tsx       # App settings
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
└── main.tsx              # App entry point
```

## 🔌 Backend Integration

The app is designed to work with a backend API. Configure your backend URL via `VITE_API_BASE_URL` environment variable.

### Expected API Endpoints:

- `GET /pdf/list` - List all uploaded PDFs
- `POST /pdf/upload` - Upload a new PDF
- `POST /quiz/generate` - Generate quiz questions
- `POST /quiz/submit` - Submit quiz answers
- `GET /progress/summary` - Get progress statistics
- `POST /chat/new` - Create new chat session
- `POST /chat/send` - Send chat message (supports streaming)
- `GET /youtube/recs` - Get video recommendations
- `GET /health` - API health check

All API integration points are marked with comments in the code for easy backend connection.

## 🚀 Deployment

### Using Lovable
Simply open [Lovable](https://lovable.dev/projects/ab1546db-9ed2-4eca-b794-6ec0e605103b) and click on Share → Publish.

### Custom Domain
Navigate to Project > Settings > Domains and click Connect Domain.

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## 📝 Development Notes

- All components use semantic color tokens from the design system
- Responsive breakpoints: mobile (<768px), tablet (768-1279px), desktop (1280px+)
- Touch-friendly controls with appropriate sizing for mobile devices
- Smooth animations and transitions throughout the app
- Backend API calls are prepared but using mock data until connected

🛠️ How I Built the Project

I developed this project using **Lovable** as the main AI-assisted development platform.

* The **frontend** was created in **Lovable**, using React and Tailwind CSS for a clean and responsive interface.
* The **Lovable Cloud** handled **backend storage** and **user authentication**.
* **n8n** was integrated to build the **RAG (Retrieval-Augmented Generation)** workflow, connecting **OpenAI** and **Pinecone** for intelligent, context-aware chat responses based on uploaded PDFs.
* Additionally, I used **ChatGPT** to refine and improve prompts throughout the development process, ensuring high-quality and efficient AI-assisted outputs.


✅ What’s Done

### **A. Must-Have Features**

1. **Source Selector (Done)**

<img width="1436" height="781" alt="Screenshot 2025-10-09 at 11 38 12 PM" src="https://github.com/user-attachments/assets/00507223-233d-42a7-921f-1d7b81b80b31" />

   * Lets users choose between *All Uploaded PDFs* or a *Specific PDF*.
   * Includes pre-seeded NCERT Class XI Physics PDFs for testing.
   * Allows users to upload their own coursebook PDFs.

2. **PDF Viewer (Done)**

<img width="1439" height="809" alt="Screenshot 2025-10-09 at 11 40 58 PM" src="https://github.com/user-attachments/assets/1b6e4dad-cdf4-4544-8b9d-c4d4c8ff8bb4" />


   * Displays the selected PDF alongside the chat interface in a tab or split view.

3. **Quiz Generator Engine (Done)**

<img width="1440" height="812" alt="Screenshot 2025-10-09 at 11 43 00 PM" src="https://github.com/user-attachments/assets/c9d67bdd-d754-4dc9-a905-2ee244f465cb" />

   * Generates **MCQs**, **SAQs**, and **LAQs** from the selected or uploaded PDFs.
   * Renders the quiz, captures answers, scores submissions, and stores attempts.
   * Provides explanations for correct answers and allows generating new question sets.

4. **Progress Tracking (Done)**

   * Tracks user strengths and weaknesses based on quiz results.
   * Displays a small dashboard to visualize learning progress.

---

### **B. Nice-to-Have Features**

1. **Chat UI (ChatGPT-Inspired) (Done)**

   * Acts as a virtual teacher or study companion.
   * Includes a left drawer for chat history, main chat area, and bottom input box.
   * Supports new chats, switching between sessions, and clean, mobile-friendly design.

2. **RAG Answers with Citations (Done)**

   * Ingests selected PDFs (chunking + embedding).
   * Chatbot answers include citations with page numbers and short quotes (e.g., “According to p. 23: ‘…’”).

---

⚙️ n8n Workflows Overview

This project integrates two n8n workflows to handle PDF data ingestion, vector storage, and AI-powered chat responses using OpenAI and Pinecone.

⸻

🧠 Workflow 1: Document Ingestion & Embedding

File: workflow_1
Purpose: Upload and process PDFs into vector embeddings for semantic search and context retrieval.

Workflow Steps:
	1.	Webhook Trigger – Listens for POST requests from the web app when a user uploads a PDF.
	2.	Default Data Loader – Loads the PDF content from the incoming file stream.
	3.	Recursive Character Text Splitter – Splits large text into smaller overlapping chunks for efficient embedding and context accuracy.
	4.	OpenAI Embeddings – Converts each text chunk into high-dimensional vector embeddings using the OpenAI Embeddings API.
	5.	Pinecone Vector Store – Stores the embeddings along with metadata (like filename, user ID, and timestamp) for future semantic retrieval by the chatbot.

Outcome:
Each uploaded PDF is processed, vectorized, and stored in Pinecone, enabling contextual and document-specific question answering in the chat interface.

⸻

💬 Workflow 2: AI Chat Agent with Contextual Retrieval

File: workflow_2
Purpose: Provide intelligent chat responses using the stored PDF knowledge base.

Workflow Steps:
	1.	When Chat Message Received (Chat Trigger) – Handles incoming messages from the frontend chat UI or the n8n embedded chat endpoint.
	2.	AI Agent Node – Core logic unit that manages context, memory, and interaction with OpenAI’s Chat Model.
	3.	OpenAI Chat Model – Generates responses using the GPT model, considering user messages, memory, and document context.
	4.	Simple Memory Node – Maintains short-term conversational context to enable follow-up questions and coherent dialogue.
	5.	Pinecone Vector Store (Tool Integration) – Fetches the most relevant document chunks based on user queries to ground responses in PDF content.
	6.	OpenAI Embeddings Node – Generates embeddings for the current query to perform similarity searches within Pinecone.

Outcome:
This workflow allows users to chat with their uploaded PDFs — the AI retrieves the most relevant sections from Pinecone and crafts detailed, accurate answers.

⸻

🔗 Combined Functionality

Together, both workflows enable a Retrieval-Augmented Generation (RAG) system:
	•	Workflow 1 handles document processing and storage.

  <img width="1054" height="608" alt="Screenshot 2025-10-09 at 10 27 15 PM" src="https://github.com/user-attachments/assets/99af257d-048c-41e1-858e-d66b0ff0f60c" />

	•	Workflow 2 uses the stored data to generate context-aware chat responses.
  
  <img width="1020" height="623" alt="Screenshot 2025-10-09 at 10 27 51 PM" src="https://github.com/user-attachments/assets/0c58941a-fa9c-4064-8795-e6ff988e237a" />


This setup powers the “Chat with PDF” feature in the SmartRevise web application, enabling users to query, learn, and revise directly from their course materials.

⸻

 🚧 What’s Missing

* **YouTube Video Recommender (UI Only)**

<img width="1438" height="813" alt="Screenshot 2025-10-09 at 11 43 24 PM" src="https://github.com/user-attachments/assets/c7460c63-61dc-4420-aeab-25c72650b092" />


  * The interface for showing educational YouTube videos is implemented.
  * Backend functionality to fetch and recommend relevant videos is not yet integrated.

---

## 🤖 Use of LLM Tools

* **Lovable AI** – For building and styling the frontend efficiently.
* **OpenAI (via n8n)** – For chat models and embeddings used in the RAG pipeline.
* **Google Gemini (through Lovable Cloud)** – For quiz generation and context understanding.
* **ChatGPT** – For improving and refining prompts during development to optimize AI-assisted output.







## 📄 License

Built for educational purposes. © 2025 SmartRevise.

---

**Lovable Project URL**: https://lovable.dev/projects/ab1546db-9ed2-4eca-b794-6ec0e605103b

**Note**: Designed specifically for Indian Class XI-XII students preparing with NCERT coursebooks.
