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
      <nav className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
        <div className="bg-gradient-to-r from-primary via-primary-hover to-accent rounded-2xl shadow-lg backdrop-blur-lg border border-white/10 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? "bg-white/20 text-white shadow-md"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
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
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-primary-hover to-accent shadow-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-5 w-5 text-white" />
            <span className="text-white font-heading font-bold text-lg">SmartRevise</span>
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-gradient-to-b from-primary to-primary-hover border-l border-white/10">
              <div className="flex flex-col gap-2 mt-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive(item.path)
                          ? "bg-white/20 text-white shadow-md"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-base font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                
                <div className="mt-4 pt-4 border-t border-white/20">
                  <Button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    variant="ghost"
                    className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white"
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
