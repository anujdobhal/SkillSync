import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, UserPlus, X, MessageCircle, CalendarDays, LayoutDashboard, Users } from "lucide-react";
import AppLayout from "@/components/layouts/AppLayout";
import ProjectChat from "@/components/project/ProjectChat";
import ProjectMeetings from "@/components/project/ProjectMeetings";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [project, setProject] = useState(null);
  const [creator, setCreator] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [myMembership, setMyMembership] = useState("none");
  const [loading, setLoading] = useState(true);

  const isOwner = useMemo(() => userId && project && project.creator_id === userId, [userId, project]);
  const isCollaborator = useMemo(() => isOwner || myMembership === "accepted", [isOwner, myMembership]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || "");
      await load();
    })();
  }, [id]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: p, error } = await supabase.from("projects").select("*").eq("id", id).single();
    if (error || !p) {
      toast.error("Project not found");
      navigate("/projects");
      return;
    }
    setProject(p);

    const currentUser = (await supabase.auth.getUser()).data.user;
    const currentUid = currentUser?.id || "";

    const [{ data: creatorProfile }, { data: memberRows }, { data: pendingRows }, { data: myRow }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", p.creator_id).single(),
      supabase.from("project_members").select("user_id, status").eq("project_id", p.id).eq("status", "accepted"),
      supabase.from("project_members").select("user_id, status, id").eq("project_id", p.id).eq("status", "pending"),
      supabase.from("project_members").select("status").eq("project_id", p.id).eq("user_id", currentUid).maybeSingle?.(),
    ]);

    setCreator(creatorProfile);

    const memberIds = (memberRows || []).map(r => r.user_id);
    const pendingIds = (pendingRows || []).map(r => r.user_id);
    const unique = Array.from(new Set([...memberIds, ...pendingIds]));
    let profilesMap = {};
    if (unique.length) {
      const { data: profs } = await supabase.from("profiles").select("*").in("user_id", unique);
      (profs || []).forEach(pf => { profilesMap[pf.user_id] = pf; });
    }
    setMembers((memberRows || []).map(r => profilesMap[r.user_id]).filter(Boolean));
    setPendingMembers((pendingRows || []).map(r => ({ id: r.id, profile: profilesMap[r.user_id] })).filter(Boolean));

    if (p.creator_id === currentUid) {
      setMyMembership("owner");
    } else if (myRow && (Array.isArray(myRow) ? myRow.length !== 0 : myRow)) {
      const row = Array.isArray(myRow) ? myRow[0] : myRow;
      setMyMembership(row?.status || "none");
    } else {
      setMyMembership("none");
    }

    setLoading(false);
  };

  const handleRequestAction = async (memberId, action) => {
    const { error } = await supabase
      .from("project_members")
      .update({ status: action })
      .eq("id", memberId);
    if (!error) {
      toast.success(`Request ${action}`);
      await load();
    } else {
      toast.error("Something went wrong!");
    }
  };

  const requestJoin = async () => {
    if (!id || !userId) return;
    const { data: existing } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      toast.error("Request already exists");
      return;
    }

    const { error } = await supabase
      .from("project_members")
      .insert({ project_id: id, user_id: userId, status: "pending" });

    if (error) {
      toast.error("Error sending request");
      return;
    }
    toast.success("Request sent!");
    await load();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) return null;

  // ===== PUBLIC VIEW (non-collaborator) =====
  if (!isCollaborator) {
    return (
      <AppLayout>
        <div className="p-6" style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh" }}>
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate("/projects")} className="mb-6">← Back to Projects</Button>

            <Card className="glass-card p-8 mb-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{project.title}</h1>
                {project.domain && <Badge style={{ backgroundColor: "var(--primary)", color: "#fff" }}>{project.domain}</Badge>}
              </div>
              {project.description && <p className="text-muted-foreground mb-6">{project.description}</p>}
              {project.required_skills?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.required_skills.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }}>
                <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>Team Size</p><p className="font-semibold" style={{ color: "var(--text-primary)" }}>{members.length} / {project.max_team_size}</p></div>
                <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>Created</p><p className="font-semibold" style={{ color: "var(--text-primary)" }}>{new Date(project.created_at).toLocaleDateString()}</p></div>
              </div>
            </Card>

            {myMembership === "none" && (
              <Button onClick={requestJoin} className="w-full mb-6" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
                <UserPlus className="w-4 h-4 mr-2" /> Request to Join
              </Button>
            )}
            {myMembership === "pending" && (
              <Card className="glass-card p-4 mb-6 text-center"><p style={{ color: "var(--warning)" }}>⏳ Your join request is pending</p></Card>
            )}

            {creator && (
              <Card className="glass-card p-6">
                <h3 className="font-bold mb-3" style={{ color: "var(--text-primary)" }}>Project Creator</h3>
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
                    {creator.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{creator.name}</p>
                    {creator.department && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{creator.department}</p>}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // ===== COLLABORATOR DASHBOARD VIEW =====
  return (
    <AppLayout>
      <div className="p-6" style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh" }}>
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/projects")} className="mb-4">← Back to Projects</Button>

          {/* Project Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{project.title}</h1>
                {project.domain && <Badge style={{ backgroundColor: "var(--primary)", color: "#fff" }}>{project.domain}</Badge>}
              </div>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                {members.length + 1} members • Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Tabbed Dashboard */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }} className="grid grid-cols-3 w-full border">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" /> Team Chat
              </TabsTrigger>
              <TabsTrigger value="meetings" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Meetings
              </TabsTrigger>
            </TabsList>

            {/* ---- OVERVIEW TAB ---- */}
            <TabsContent value="overview">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* About */}
                  <Card className="p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                    <h3 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>About</h3>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{project.description || "No description provided."}</p>
                    {project.required_skills?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Tech Stack</p>
                        <div className="flex flex-wrap gap-2">
                          {project.required_skills.map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)}
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 text-center" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                      <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{members.length + 1}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Members</p>
                    </Card>
                    <Card className="p-4 text-center" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                      <p className="text-2xl font-bold" style={{ color: "var(--warning)" }}>{pendingMembers.length}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Pending</p>
                    </Card>
                    <Card className="p-4 text-center" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                      <p className="text-2xl font-bold" style={{ color: "var(--success)" }}>{project.max_team_size || 5}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Max Size</p>
                    </Card>
                  </div>

                  {/* Creator */}
                  {creator && (
                    <Card className="p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                      <h3 className="font-bold mb-3" style={{ color: "var(--text-primary)" }}>Project Creator</h3>
                      <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
                          {creator.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{creator.name}</p>
                          {creator.department && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{creator.department}</p>}
                        </div>
                        {isOwner && <Badge className="ml-auto" style={{ backgroundColor: "rgba(79,70,229,0.15)", color: "var(--primary)" }}>You</Badge>}
                      </div>
                    </Card>
                  )}
                </div>

                {/* Sidebar - Members & Pending */}
                <div className="space-y-6">
                  <Card className="p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-4 w-4" style={{ color: "var(--primary)" }} />
                      <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Team Members</h3>
                    </div>
                    {members.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {members.map(member => (
                          <div key={member.user_id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "var(--success)", color: "#fff" }}>
                              {member.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm" style={{ color: "var(--text-primary)" }}>{member.name}</span>
                            {member.user_id === userId && <Badge className="ml-auto text-[10px]" style={{ backgroundColor: "rgba(79,70,229,0.15)", color: "var(--primary)" }}>You</Badge>}
                          </div>
                        ))}
                      </div>
                    )}
                    {members.length === 0 && (
                      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>No members yet (besides the creator).</p>
                    )}
                  </Card>

                  {/* Pending Requests (Owner only) */}
                  {isOwner && pendingMembers.length > 0 && (
                    <Card className="p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                      <h3 className="font-bold mb-3" style={{ color: "var(--text-primary)" }}>Pending Requests ({pendingMembers.length})</h3>
                      <div className="space-y-2">
                        {pendingMembers.map(pm => (
                          <div key={pm.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }}>
                            <span className="text-sm" style={{ color: "var(--text-primary)" }}>{pm.profile?.name}</span>
                            <div className="flex gap-1">
                              <button className="p-1 rounded" style={{ backgroundColor: "var(--success)" }} onClick={() => handleRequestAction(pm.id, "accepted")}>
                                <Check className="h-3.5 w-3.5 text-white" />
                              </button>
                              <button className="p-1 rounded" style={{ backgroundColor: "var(--error)" }} onClick={() => handleRequestAction(pm.id, "rejected")}>
                                <X className="h-3.5 w-3.5 text-white" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ---- TEAM CHAT TAB ---- */}
            <TabsContent value="chat">
              <ProjectChat projectId={id} currentUserId={userId} />
            </TabsContent>

            {/* ---- MEETINGS TAB ---- */}
            <TabsContent value="meetings">
              <Card className="p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                <ProjectMeetings projectId={id} currentUserId={userId} isOwner={isOwner} />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProjectDetails;
