import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layouts/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Check, X, GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingMentors, setPendingMentors] = useState([]);
  const [approvedMentors, setApprovedMentors] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => { checkAdminAndLoad(); }, []);

  const checkAdminAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", session.user.id)
      .single();

    if (!profile?.is_admin) {
      toast.error("Access denied. Admin only.");
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const [{ data: pending }, { data: approved }, { data: users }] = await Promise.all([
      supabase.from("profiles").select("user_id, name, email, department, year, mentor_expertise, mentor_bio, mentor_linkedin, years_experience").eq("mentor_status", "pending"),
      supabase.from("profiles").select("user_id, name, email, department, mentor_expertise, years_experience").eq("mentor_status", "approved"),
      supabase.from("profiles").select("user_id, name, email, department, year, is_mentor, mentor_status, created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    setPendingMentors(pending || []);
    setApprovedMentors(approved || []);
    setAllUsers(users || []);
  };

  const handleMentorAction = async (userId, action) => {
    const { error } = await supabase
      .from("profiles")
      .update({ mentor_status: action })
      .eq("user_id", userId);

    if (error) { toast.error("Failed to update"); console.error(error); }
    else { toast.success(`Mentor ${action}!`); await loadData(); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="p-6" style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh" }}>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="w-8 h-8" style={{ color: "var(--primary)" }} />
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Admin Panel</h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Manage mentor applications and users</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="p-4 text-center" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-2xl font-bold" style={{ color: "var(--warning)" }}>{pendingMentors.length}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Pending Applications</p>
            </Card>
            <Card className="p-4 text-center" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-2xl font-bold" style={{ color: "var(--success)" }}>{approvedMentors.length}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Verified Mentors</p>
            </Card>
            <Card className="p-4 text-center" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{allUsers.length}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total Users</p>
            </Card>
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList style={{ backgroundColor: "var(--bg-card)" }} className="grid grid-cols-3 w-full border">
              <TabsTrigger value="pending">Pending ({pendingMentors.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved Mentors ({approvedMentors.length})</TabsTrigger>
              <TabsTrigger value="users">All Users ({allUsers.length})</TabsTrigger>
            </TabsList>

            {/* Pending Mentor Applications */}
            <TabsContent value="pending">
              {pendingMentors.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                  <p style={{ color: "var(--text-muted)" }}>No pending mentor applications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingMentors.map(app => (
                    <Card key={app.user_id} className="p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{app.name}</h3>
                            <Badge style={{ backgroundColor: "rgba(234,179,8,0.15)", color: "var(--warning)" }}>Pending</Badge>
                          </div>
                          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                            {app.email} • {app.department || "N/A"} • Year {app.year || "N/A"} • {app.years_experience || 0} yrs experience
                          </p>

                          {app.mentor_expertise?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {app.mentor_expertise.map((e, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{e}</Badge>
                              ))}
                            </div>
                          )}

                          {app.mentor_bio && (
                            <p className="text-sm mt-3 italic p-3 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                              "{app.mentor_bio}"
                            </p>
                          )}

                          {app.mentor_linkedin && (
                            <a href={app.mentor_linkedin} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-2 inline-block" style={{ color: "var(--primary)" }}>
                              View LinkedIn →
                            </a>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button style={{ backgroundColor: "var(--success)", color: "#fff" }}
                            onClick={() => handleMentorAction(app.user_id, "approved")}>
                            <Check className="h-4 w-4 mr-2" /> Approve
                          </Button>
                          <Button variant="outline"
                            onClick={() => handleMentorAction(app.user_id, "rejected")}>
                            <X className="h-4 w-4 mr-2" /> Reject
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Approved Mentors */}
            <TabsContent value="approved">
              {approvedMentors.length === 0 ? (
                <div className="text-center py-12">
                  <p style={{ color: "var(--text-muted)" }}>No approved mentors yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedMentors.map(m => (
                    <div key={m.user_id} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
                      <div>
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{m.name}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {m.email} • {m.department || "N/A"} • {m.years_experience || 0} yrs exp
                        </p>
                        {m.mentor_expertise?.length > 0 && (
                          <div className="flex gap-1 mt-1">{m.mentor_expertise.slice(0, 4).map((e, i) => <Badge key={i} variant="outline" className="text-[10px]">{e}</Badge>)}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge style={{ backgroundColor: "var(--success)", color: "#fff" }}>
                          <Check className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => handleMentorAction(m.user_id, "rejected")}>
                          Revoke
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* All Users */}
            <TabsContent value="users">
              <div className="space-y-2">
                {allUsers.map(u => (
                  <div key={u.user_id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{u.name || "No name"}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{u.email} • {u.department || "N/A"} • Year {u.year || "N/A"}</p>
                    </div>
                    <div className="flex gap-2">
                      {u.is_mentor && <Badge style={{ backgroundColor: "var(--success)", color: "#fff" }} className="text-[10px]">Mentor</Badge>}
                      {u.mentor_status === "pending" && <Badge style={{ backgroundColor: "var(--warning)", color: "#000" }} className="text-[10px]">Pending</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default Admin;
