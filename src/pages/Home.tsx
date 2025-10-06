import { Button } from "@/components/ui/button";
import { BookOpen, Brain, TrendingUp, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-accent">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')]" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white animate-slide-up">
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6">
              Master Your NCERT <br />
              <span className="text-accent-foreground">Smart Revision</span> Starts Here
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Upload your coursebooks, generate intelligent quizzes, track your progress,
              and chat with AI—all designed for Class XI-XII students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-accent hover:bg-accent-hover text-accent-foreground font-semibold text-lg px-8 py-6 shadow-xl"
              >
                <Link to="/app">Start Revising</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold text-lg px-8 py-6 backdrop-blur-sm"
              >
                <Link to="/history">View Progress</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full">
            <path
              fill="hsl(var(--background))"
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-12">
            Everything You Need to Excel
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<BookOpen className="h-10 w-10" />}
              title="PDF Viewer"
              description="Upload and view your NCERT PDFs with smooth navigation and zoom controls."
            />
            <FeatureCard
              icon={<Brain className="h-10 w-10" />}
              title="Smart Quizzes"
              description="Generate MCQ, SAQ, and LAQ questions tailored to your coursebook content."
            />
            <FeatureCard
              icon={<TrendingUp className="h-10 w-10" />}
              title="Progress Tracking"
              description="Monitor your accuracy, identify strengths and weaknesses across topics."
            />
            <FeatureCard
              icon={<MessageCircle className="h-10 w-10" />}
              title="AI Tutor Chat"
              description="Ask questions and get instant help with page citations from your PDFs."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
            Ready to Ace Your Exams?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students who are revising smarter with SmartRevise.
            Start your journey today—it's fast, easy, and free to try.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-lg px-8 py-6"
          >
            <Link to="/app">Get Started Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 SmartRevise. Built for Indian students, by passionate educators.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div className="bg-card border rounded-xl p-6 hover:shadow-lg transition-shadow duration-300 group">
      <div className="text-accent mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-heading font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default Home;
