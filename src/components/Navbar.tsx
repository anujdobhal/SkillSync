import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Sparkles, LogOut, User, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import Notifications from "./Notifications";
import { useChat } from "@/components/chat/ChatContext";
import { MessageCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-nowrap">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-hover">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">SkillSync</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center min-w-0">
            <Link to="/" className="text-foreground/80 hover:text-primary transition-colors font-medium">
              Home
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-foreground/80 hover:text-primary transition-colors font-medium">
                  Dashboard
                </Link>
                <Link to="/find-teammates" className="text-foreground/80 hover:text-primary transition-colors font-medium">
                  Find
                </Link>
                <Link to="/connections" className="text-foreground/80 hover:text-primary transition-colors font-medium">
                  Connections
                </Link>
                <Link to="/projects" className="text-foreground/80 hover:text-primary transition-colors font-medium">
                  Projects
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-md hover:bg-accent text-foreground/80" aria-label="More links">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    <DropdownMenuItem asChild>
                      <Link to="/features">Features</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/mentors">Mentors</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/about">About Us</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/contact">Contact</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/features" className="text-foreground/80 hover:text-primary transition-colors font-medium">
                  Features
                </Link>
                <Link to="/mentors" className="text-foreground/80 hover:text-primary transition-colors font-medium">
                  Mentors
                </Link>
                <Link to="/about" className="text-foreground/80 hover:text-primary transition-colors font-medium">
                  About Us
                </Link>
                <Link to="/contact" className="text-foreground/80 hover:text-primary transition-colors font-medium">
                  Contact
                </Link>
              </>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
            {user ? (
              <>
                <Notifications />
                <ChatIconButton />
                <Link to="/profile">
                  <Button variant="ghost" className="font-medium">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="font-medium"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-gradient-to-r from-primary to-accent text-white font-medium glow-hover">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

function ChatIconButton() {
  const { setOpen, unreadMap } = useChat();
  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);
  return (
    <button
      className="relative p-2 rounded-md hover:bg-accent text-foreground/80"
      aria-label="Open messages"
      onClick={() => setOpen(true)}
    >
      <MessageCircle className="w-5 h-5" />
      {totalUnread > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-semibold px-1.5 min-w-[18px] h-[18px] shadow-lg">
          {totalUnread > 99 ? "99+" : totalUnread}
        </span>
      )}
    </button>
  );
}
