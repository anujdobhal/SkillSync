import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Sparkles, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Notifications from "./Notifications";
import { useChat } from "@/components/chat/ChatContext";
import { MessageCircle } from "lucide-react";
const Navbar = ({ isScrolled }) => {
  const [user, setUser] = useState(null);

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
    <nav
      style={{
        backgroundColor: isScrolled ? 'var(--bg-card)' : 'transparent',
        borderBottomColor: isScrolled ? 'var(--border)' : 'transparent',
        height: '64px',
      }}
      className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300"
    >
      <div className="h-full px-6 flex items-center justify-between max-w-full">
        {/* Logo */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
          <div style={{ backgroundColor: 'var(--primary)' }} className="w-10 h-10 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <span style={{ color: 'var(--text-primary)' }} className="text-xl font-bold hidden sm:inline">SkillSync</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {user ? (
            <>
              <Link to="/dashboard" style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium hover:text-[var(--text-primary)] transition-colors">
                Dashboard
              </Link>
              <Link to="/find-teammates" style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium hover:text-[var(--text-primary)] transition-colors">
                Discover
              </Link>
              <Link to="/projects" style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium hover:text-[var(--text-primary)] transition-colors">
                Projects
              </Link>
              <Link to="/connections" style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium hover:text-[var(--text-primary)] transition-colors">
                Connections
              </Link>
            </>
          ) : (
            <>
              <Link to="/" style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium hover:text-[var(--text-primary)] transition-colors">
                Home
              </Link>
              <Link to="/features" style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium hover:text-[var(--text-primary)] transition-colors">
                Features
              </Link>
              <Link to="/mentors" style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium hover:text-[var(--text-primary)] transition-colors">
                Mentors
              </Link>
              <Link to="/about" style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium hover:text-[var(--text-primary)] transition-colors">
                About
              </Link>
            </>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <>
              <Notifications />
              <ChatIconButton />
              <Link to="/profile" className="hidden sm:block">
                <Button variant="ghost" className="font-medium text-sm">
                  <User className="w-4 h-4 mr-1" />
                  Profile
                </Button>
              </Link>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="font-medium text-sm"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" className="font-medium text-sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button style={{ backgroundColor: 'var(--primary)', color: 'var(--text-primary)' }} className="font-medium text-sm hover:opacity-90">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Get Started
                </Button>
              </Link>
            </>
          )}
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
