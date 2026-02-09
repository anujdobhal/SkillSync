import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, UserPlus, X } from "lucide-react";

interface Project {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  domain: string | null;
  required_skills: string[] | null;
  max_team_size: number | null;
  is_public: boolean | null;
  created_at: string;
}

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [project, setProject] = useState<Project | null>(null);
  const [creator, setCreator] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [myMembership, setMyMembership] = useState<"none" | "pending" | "accepted" | "owner">("none");
  const [loading, setLoading] = useState(true);

  const isOwner = useMemo(() => userId && project && project.creator_id === userId, [userId, project]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || "");
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setProject(p as Project);

    const [{ data: creatorProfile }, { data: memberRows }, { data: pendingRows }, { data: myRow }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", p.creator_id).single(),
      supabase.from("project_members").select("user_id, status").eq("project_id", p.id).eq("status", "accepted"),
      supabase.from("project_members").select("user_id, status, id").eq("project_id", p.id).eq("status", "pending"),
      supabase.from("project_members").select("status").eq("project_id", p.id).eq("user_id", (await supabase.auth.getUser()).data.user?.id || "").maybeSingle?.() as any,
    ]);

    setCreator(creatorProfile);

    const memberIds = (memberRows || []).map(r => r.user_id);
    const pendingIds = (pendingRows || []).map(r => r.user_id);
    const unique = Array.from(new Set([...memberIds, ...pendingIds]));
    let profilesMap: Record<string, any> = {};
    if (unique.length) {
      const { data: profs } = await supabase.from("profiles").select("*").in("user_id", unique);
      (profs || []).forEach(pf => { profilesMap[pf.user_id] = pf; });
    }
    setMembers((memberRows || []).map(r => profilesMap[r.user_id]).filter(Boolean));
    setPendingMembers((pendingRows || []).map(r => ({ id: (r as any).id, profile: profilesMap[r.user_id] })).filter(Boolean));

    if (p.creator_id === ((await supabase.auth.getUser()).data.user?.id || "")) {
      setMyMembership("owner");
    } else if (myRow && (myRow as any).length !== 0) {
      const row = Array.isArray(myRow) ? myRow[0] : myRow;
      setMyMembership((row?.status as any) || "none");
    } else {
      setMyMembership("none");
    }

    setLoading(false);
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
    const { error } = await supabase.from("project_members").insert({ project_id: id, user_id: userId, status: "pending" });
    if (error) {
      toast.error("Failed to send request");
      return;
    }
    toast.success("Request sent");
    setMyMembership("pending");
    await load();
  };

  const handleApprove = async (memberId: string, status: "accepted" | "rejected") => {
    const { error } = await supabase.from("project_members").update({ status }).eq("id", memberId);
    if (error) {
      toast.error("Action failed");
      return;
    }
    toast.success(status === "accepted" ? "Member added" : "Request rejected");
    await load();
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card className="glass-card p-8 mb-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-3xl font-bold">{project.title}</h1>
                  <Badge variant="secondary">{project.domain || "General"}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-4">Created on {new Date(project.created_at).toLocaleString()}</div>
                {project.description && <p className="text-muted-foreground leading-7">{project.description}</p>}
                {project.required_skills && project.required_skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.required_skills.map((s, i) => (
                      <Badge key={i} variant="outline">{s}</Badge>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Team</h2>
                {members.length === 0 ? (
                  <p className="text-muted-foreground">No members yet</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {members.map((m, i) => (
                      <div key={i} className="px-3 py-2 rounded-lg bg-muted/50 text-sm">
                        {m?.name || "Member"}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="glass-card p-6">
                <h3 className="font-semibold mb-3">Owner</h3>
                <div className="px-3 py-2 rounded-lg bg-muted/50 text-sm">{creator?.name || "Unknown"}</div>
                <div className="text-xs text-muted-foreground mt-2">Max team size: {project.max_team_size || 5}</div>
              </Card>

              {!isOwner && (
                <Card className="glass-card p-6">
                  <h3 className="font-semibold mb-3">Join this project</h3>
                  {myMembership === "accepted" && (
                    <Button disabled variant="outline" className="w-full"><Check className="w-4 h-4 mr-2" />You are a member</Button>
                  )}
                  {myMembership === "pending" && (
                    <Button disabled variant="outline" className="w-full"><ClockIcon /> Pending approval</Button>
                  )}
                  {myMembership === "none" && (
                    <Button className="w-full bg-gradient-to-r from-primary to-accent text-white" onClick={requestJoin}>
                      <UserPlus className="w-4 h-4 mr-2" />Request to Join
                    </Button>
                  )}
                </Card>
              )}

              {isOwner && (
                <Card className="glass-card p-6">
                  <h3 className="font-semibold mb-4">Pending Requests</h3>
                  {pendingMembers.length === 0 ? (
                    <p className="text-muted-foreground">No pending requests</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingMembers.map((r) => (
                        <div key={r.id} className="flex items-center justify-between gap-3">
                          <div className="px-3 py-2 rounded-lg bg-muted/50 text-sm">{r.profile?.name || "User"}</div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(r.id, "accepted")}><Check className="w-4 h-4 mr-1" />Accept</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleApprove(r.id, "rejected")}><X className="w-4 h-4 mr-1" />Reject</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

const ClockIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

export default ProjectDetails;


