import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AppLayout from "@/components/layouts/AppLayout";

const Projects = () => {
  const [userId, setUserId] = useState("");
  const [ongoingProjects, setOngoingProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || "");
      await loadProjects(session?.user?.id || "");
    })();
  }, []);

  const loadProjects = async (uid) => {
    setLoading(true);
    try {
      // 1. Fetch projects created by me
      const { data: mine, error: myErr } = uid 
        ? await supabase.from("projects").select("*").eq("creator_id", uid).order("created_at", { ascending: false })
        : { data: [], error: null };

      if (myErr) throw myErr;
      setMyProjects(mine || []);

      // 2. Fetch projects where I am a member and status is accepted (excluding my own projects)
      const { data: memberRows, error: memberErr } = uid
        ? await supabase.from("project_members").select("project_id").eq("user_id", uid).eq("status", "accepted")
        : { data: [], error: null };

      if (memberErr) throw memberErr;

      if (memberRows && memberRows.length > 0) {
        const projectIds = memberRows.map(r => r.project_id);
        const { data: ongoing, error: ongoingErr } = await supabase
          .from("projects")
          .select("*")
          .in("id", projectIds)
          .neq("creator_id", uid) // exclude my own projects since they are in "My Projects"
          .order("created_at", { ascending: false });

        if (ongoingErr) throw ongoingErr;
        setOngoingProjects(ongoing || []);
      } else {
        setOngoingProjects([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const Empty = ({ text }) => (
    <div className="col-span-full text-center py-12 text-muted-foreground">{text}</div>
  );

  const ProjectCard = ({ p }) => (
    <a href={`/project/${p.id}`}>
      <Card className="glass-card p-6 hover:scale-[1.01] transition-transform cursor-pointer">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-xl font-semibold">{p.title}</h3>
          <Badge variant="secondary">{p.domain || "General"}</Badge>
        </div>
        {p.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{p.description}</p>
        )}
        {p.required_skills && p.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {p.required_skills.slice(0, 4).map((s, i) => (
              <Badge key={i} variant="outline">{s}</Badge>
            ))}
            {p.required_skills.length > 4 && (
              <Badge variant="outline">+{p.required_skills.length - 4}</Badge>
            )}
          </div>
        )}
        <div className="text-xs text-muted-foreground">Team size: {p.max_team_size || 5} • {new Date(p.created_at).toLocaleDateString()}</div>
      </Card>
    </a>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <section className="p-6" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold">Projects</h1>
              <p className="text-muted-foreground">Manage your ongoing projects or view yours</p>
            </div>
            <a href="/projects/new">
              <Button className="bg-gradient-to-r from-primary to-accent text-white">Create Project</Button>
            </a>
          </div>

          <Tabs defaultValue="ongoing">
            <TabsList className="grid grid-cols-2 w-full mb-8">
              <TabsTrigger value="ongoing">Ongoing Projects ({ongoingProjects.length})</TabsTrigger>
              <TabsTrigger value="mine">My Projects ({myProjects.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="ongoing">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ongoingProjects.length === 0 ? (
                  <Empty text="No ongoing joined projects found" />
                ) : (
                  ongoingProjects.map(p => <ProjectCard key={p.id} p={p} />)
                )}
              </div>
            </TabsContent>

            <TabsContent value="mine">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProjects.length === 0 ? (
                  <Empty text="You haven't created any projects yet" />
                ) : (
                  myProjects.map(p => <ProjectCard key={p.id} p={p} />)
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </AppLayout>
  );
};

export default Projects;
