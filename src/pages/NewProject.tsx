import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SkillsInput from "@/components/SkillsInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NewProject = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [maxTeamSize, setMaxTeamSize] = useState<number>(5);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);
    })();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!currentUserId) return;

    setSubmitting(true);
    const { error } = await supabase.from("projects").insert({
      creator_id: currentUserId,
      title: title.trim(),
      description: description.trim() || null,
      domain: domain || null,
      required_skills: skills,
      max_team_size: Number(maxTeamSize) || 5,
      is_public: isPublic,
    });

    setSubmitting(false);
    if (error) {
      toast.error("Failed to create project");
      // eslint-disable-next-line no-console
      console.error(error);
      return;
    }

    toast.success("Project created");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <Card className="glass-card p-8">
            <h1 className="text-3xl font-bold mb-6">Create New Project</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="e.g., Smart Attendance System" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Briefly describe your project idea" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div>
                <Label>Domain</Label>
                <Select value={domain} onValueChange={setDomain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Web Development">Web Development</SelectItem>
                    <SelectItem value="Mobile Apps">Mobile Apps</SelectItem>
                    <SelectItem value="AI/ML">AI/ML</SelectItem>
                    <SelectItem value="Data Science">Data Science</SelectItem>
                    <SelectItem value="Blockchain">Blockchain</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Required Skills</Label>
                <SkillsInput skills={skills} onChange={setSkills} placeholder="Add skills (press Enter)" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="team">Max Team Size</Label>
                  <Input id="team" type="number" min={2} max={20} value={maxTeamSize} onChange={(e) => setMaxTeamSize(parseInt(e.target.value || "5", 10))} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
                  <Label htmlFor="public">Public Project</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-primary to-accent text-white">
                  {submitting ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NewProject;


