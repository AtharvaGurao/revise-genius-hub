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

## 📄 License

Built for educational purposes. © 2025 SmartRevise.

---

**Lovable Project URL**: https://lovable.dev/projects/ab1546db-9ed2-4eca-b794-6ec0e605103b

**Note**: Designed specifically for Indian Class XI-XII students preparing with NCERT coursebooks.
