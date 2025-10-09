import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Home, FileText, Brain, Youtube, Settings, LogOut, Library } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NavBarProps {
  onTogglePdfLibrary?: () => void;
}

const NavBar = ({ onTogglePdfLibrary }: NavBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/chat-with-pdf", label: "Chat with PDF", icon: FileText },
    { path: "/revise-pro", label: "RevisePro", icon: Brain },
    { path: "/edu-clips", label: "EduClips", icon: Youtube },
  ];

  const showPdfLibraryButton = ["/chat-with-pdf", "/revise-pro", "/edu-clips"].includes(
    location.pathname
  );

  return (
    <header className="border-b bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {showPdfLibraryButton && onTogglePdfLibrary && (
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePdfLibrary}
            className="flex items-center gap-2"
          >
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">PDF Library</span>
          </Button>
        )}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <nav className="flex flex-col gap-2 mt-8">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path}>
                  <Button
                    variant={isActive(link.path) ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    <link.icon className="h-4 w-4 mr-2" />
                    {link.label}
                  </Button>
                </Link>
              ))}
              <Link to="/settings">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Home className="h-5 w-5 text-foreground" />
          <h1 className="font-heading font-bold text-lg">SmartRevise</h1>
        </Link>
      </div>

      <nav className="hidden lg:flex items-center gap-2">
        {navLinks.map((link) => (
          <Link key={link.path} to={link.path}>
            <Button
              variant={isActive(link.path) ? "default" : "ghost"}
              className={isActive(link.path) ? "bg-primary text-primary-foreground" : ""}
            >
              <link.icon className="h-4 w-4 mr-2" />
              {link.label}
            </Button>
          </Link>
        ))}
        <Link to="/settings">
          <Button variant="ghost">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </Link>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </nav>
    </header>
  );
};

export default NavBar;
