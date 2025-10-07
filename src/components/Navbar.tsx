import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Home, 
  FileText, 
  MessageCircle, 
  ClipboardList, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Menu 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "PDF Library", path: "/app", icon: FileText },
  { name: "AI Chat", path: "/app", icon: MessageCircle, tabValue: "chat" },
  { name: "Quiz", path: "/app", icon: ClipboardList, tabValue: "quiz" },
  { name: "Progress", path: "/history", icon: TrendingUp },
  { name: "Settings", path: "/settings", icon: Settings },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
        <div className="bg-background/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-primary/10 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-foreground/70 hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-foreground/70 hover:bg-destructive/10 hover:text-destructive rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border-b border-primary/10">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            <span className="text-foreground font-heading font-bold text-lg">SmartRevise</span>
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground hover:bg-primary/5 hover:text-primary">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background/95 backdrop-blur-xl border-l border-primary/10">
              <div className="flex flex-col gap-2 mt-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive(item.path)
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-foreground/70 hover:bg-primary/5 hover:text-primary"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-base font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                
                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    variant="ghost"
                    className="w-full justify-start text-foreground/70 hover:bg-destructive/10 hover:text-destructive rounded-xl"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16 md:h-20" />
    </>
  );
};

export default Navbar;
