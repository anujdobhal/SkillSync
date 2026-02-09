import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  Search, 
  MessageCircle, 
  FileText, 
  Shield, 
  Sparkles,
  Target,
  UserPlus,
  Calendar,
  Award,
  Globe,
  Zap
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Users,
      title: "Complete Profile Creation",
      description: "Build your professional profile with skills, interests, portfolio links, coding handles, and achievements. Showcase what makes you unique.",
      color: "from-primary to-primary/60"
    },
    {
      icon: Search,
      title: "Smart Team Matching",
      description: "Advanced search and filtering to find teammates by skill, domain, department, year, or specific interests. Find your perfect match.",
      color: "from-secondary to-secondary/60"
    },
    {
      icon: UserPlus,
      title: "Connection System",
      description: "Send and accept connection requests to build your professional network. Stay connected with collaborators.",
      color: "from-primary to-accent"
    },
    {
      icon: Shield,
      title: "Verified Profiles",
      description: "University email verification ensures you're connecting with real students. Safe and secure networking.",
      color: "from-secondary to-primary"
    },
    {
      icon: Target,
      title: "Skill-Based Discovery",
      description: "Get discovered by teams looking for your specific skills. Your expertise is always visible to the right people.",
      color: "from-accent to-primary"
    },
    {
      icon: Calendar,
      title: "Availability Tracking",
      description: "Show when you're available for new projects. Make it easy for teams to know when you can contribute.",
      color: "from-primary to-secondary"
    },
    {
      icon: Award,
      title: "Achievement Showcase",
      description: "Highlight your hackathon wins, certifications, and notable projects. Let your accomplishments speak.",
      color: "from-secondary to-accent"
    },
    {
      icon: Globe,
      title: "Portfolio Integration",
      description: "Link your GitHub, LinkedIn, LeetCode, personal website, and more. One profile, all your work.",
      color: "from-accent to-secondary"
    },
    {
      icon: Sparkles,
      title: "Mentor Connect",
      description: "Access to experienced seniors and faculty members for guidance. Get help when you need it most.",
      color: "from-primary to-highlight"
    },
    {
      icon: Zap,
      title: "Real-time Notifications",
      description: "Stay updated on connection requests, project invites. Never miss an opportunity.",
      color: "from-secondary to-highlight"
    }
  ];

  const futureFeatures = [
    
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-16 animate-slide-up">
            <h1 className="text-5xl font-bold mb-6">
              Powerful <span className="gradient-text">Features</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to find teammates, manage projects, and build your network. 
              Designed specifically for student collaboration.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="glass-card p-8 hover:scale-105 transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>

          {/* Future Enhancements */}
          <div className="max-w-4xl mx-auto">
            <Card className="glass-card p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold"></h2>
              </div>
              <p className="text-muted-foreground mb-6">
                We're constantly working to make SkillSync better.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {futureFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <p className="text-foreground/90">{feature}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Features;
