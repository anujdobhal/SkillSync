import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Sparkles, Users, Target, Zap, MessageCircle, Shield } from "lucide-react";
import heroImage from "@/assets/hero-collaboration.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Find Your Perfect
                <span className="gradient-text block">Project Partner</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Connect with talented students based on skills, interests, and experience. 
                Build amazing projects, win hackathons, and collaborate on research together.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/auth">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-white font-semibold glow-hover">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/features">
                  <Button size="lg" variant="outline" className="font-semibold">
                    Explore Features
                  </Button>
                </Link>
              </div>
              
            
            
            </div>
            <div className="relative animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
              <img 
                src={heroImage} 
                alt="Students collaborating on projects" 
                className="relative rounded-3xl shadow-2xl floating"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose SkillSync?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to find teammates and collaborate effectively
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Smart Matching",
                description: "Find teammates based on complementary skills, interests, and availability",
                color: "from-primary to-primary/60"
              },
              {
                icon: Target,
                title: "Project Discovery",
                description: "Browse and join exciting projects or create your own team",
                color: "from-secondary to-secondary/60"
              },
              {
                icon: Zap,
                title: "Quick Connect",
                description: "Send invites and form teams in minutes, not days",
                color: "from-accent to-accent/60"
              },
              {
                icon: Shield,
                title: "Verified Profiles",
                description: "Connect with real students through verified university emails",
                color: "from-primary to-accent"
              },
              {
                icon: Sparkles,
                title: "Mentor Connect",
                description: "Get guidance from experienced seniors and faculty members",
                color: "from-secondary to-primary"
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="glass-card p-8 hover:scale-105 transition-all duration-300 group cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10"></div>
        <div className="container mx-auto relative z-10">
          <div className="glass-card rounded-3xl p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">Ready to Find Your Team?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of students already collaborating on amazing projects
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-white font-semibold text-lg px-8 glow-hover">
                <Sparkles className="w-5 h-5 mr-2" />
                Create Your Profile
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
