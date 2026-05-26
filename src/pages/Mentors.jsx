import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layouts/AppLayout";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Linkedin, Mail, Star, GraduationCap, UserPlus, Check, Clock, X, MessageSquare, ShieldCheck, Send, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ProfileModal } from "@/components/ProfileModal";
import SkillsInput from "@/components/SkillsInput";

const Mentors = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [myMentorStatus, setMyMentorStatus] = useState(null); // null, pending, approved, rejected

  // "Become a Mentor" application form
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({ expertise: [], bio: "", linkedin: "", experience: "" });
  const [applySubmitting, setApplySubmitting] = useState(false);

  // Mentorship request states
  const [requestStatuses, setRequestStatuses] = useState({});
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestingMentorId, setRequestingMentorId] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  // Schedule meeting states
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [schedulingMentorId, setSchedulingMentorId] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ title: "", meeting_link: "", scheduled_at: "" });
  const [scheduling, setScheduling] = useState(false);
  const [scheduleForStudentId, setScheduleForStudentId] = useState(null); // when mentor schedules for a mentee
  const [meetings, setMeetings] = useState([]);

  // Mentor dashboard states
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myMentees, setMyMentees] = useState([]);

  // Admin: pending mentor applications (visible to approved mentors)
  const [pendingApplications, setPendingApplications] = useState([]);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => { if (currentUserId) loadMeetings(); }, [currentUserId]);

  const loadAll = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      setCurrentUserId(session.user.id);

      // Get my profile to check mentor_status
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("is_mentor, mentor_status")
        .eq("user_id", session.user.id)
        .single();

      const status = myProfile?.mentor_status || null;
      setMyMentorStatus(status);

      // Load mentorship request statuses
      const { data: myReqs } = await supabase
        .from("mentor_requests")
        .select("mentor_id, status")
        .eq("student_id", session.user.id);
      const statuses = {};
      (myReqs || []).forEach(r => { statuses[r.mentor_id] = r.status; });
      setRequestStatuses(statuses);

      // If I am an approved mentor
      if (status === "approved") {
        await loadIncomingRequests(session.user.id);
        await loadMyMentees(session.user.id);
        await loadPendingApplications();
      }
    }

    // Fetch approved mentors only
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_mentor", true);

    if (error) {
      toast.error("Error loading mentors");
      setLoading(false);
      return;
    }

    const filtered = session
      ? (data || []).filter(m => m.user_id !== session.user.id)
      : (data || []);

    setMentors(filtered);
    setLoading(false);
  };

  const loadIncomingRequests = async (userId) => {
    const { data } = await supabase.from("mentor_requests").select("*").eq("mentor_id", userId).eq("status", "pending");
    if (data && data.length > 0) {
      const ids = data.map(r => r.student_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, name, department, year").in("user_id", ids);
      const map = {}; (profiles || []).forEach(p => { map[p.user_id] = p; });
      setIncomingRequests(data.map(r => ({ ...r, student: map[r.student_id] || { name: "Unknown" } })));
    } else { setIncomingRequests([]); }
  };

  const loadMyMentees = async (userId) => {
    const { data } = await supabase.from("mentor_requests").select("*").eq("mentor_id", userId).eq("status", "accepted");
    if (data && data.length > 0) {
      const ids = data.map(r => r.student_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, name, department, year, email").in("user_id", ids);
      const map = {}; (profiles || []).forEach(p => { map[p.user_id] = p; });
      setMyMentees(data.map(r => ({ ...r, student: map[r.student_id] || { name: "Unknown" } })));
    } else { setMyMentees([]); }
  };

  const loadPendingApplications = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, name, department, year, mentor_expertise, mentor_bio, mentor_linkedin, years_experience")
      .eq("mentor_status", "pending");
    setPendingApplications(data || []);
  };

  // ===== Become a Mentor =====
  const handleApply = async () => {
    if (applyForm.expertise.length === 0) { toast.error("Please add at least one expertise area"); return; }
    if (!applyForm.bio.trim()) { toast.error("Please write a short mentor bio"); return; }
    setApplySubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || currentUserId;

    if (!userId) {
      toast.error("You are not signed in");
      setApplySubmitting(false);
      return;
    }

    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("mentor apply profile check error:", profileError);
      toast.error(profileError.message || "Failed to load your profile");
      setApplySubmitting(false);
      return;
    }

    if (!existingProfile) {
      toast.error("Your profile row was not found. Please refresh or sign in again.");
      setApplySubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        mentor_expertise: applyForm.expertise,
        mentor_bio: applyForm.bio.trim(),
        mentor_linkedin: applyForm.linkedin.trim() || null,
        years_experience: applyForm.experience ? parseInt(applyForm.experience) : null,
        mentor_status: "pending",
      })
      .eq("user_id", userId);

    if (error) {
      console.error("mentor apply error:", error);
      toast.error(error.message || error.details || error.hint || "Failed to submit application");
    } else {
      toast.success("Application submitted! 🎓 It will be reviewed by existing mentors.");
      setMyMentorStatus("pending");
      setApplyDialogOpen(false);
    }
    setApplySubmitting(false);
  };

  // ===== Approve/Reject mentor application =====
  const handleReviewApplication = async (userId, action) => {
    const { error } = await supabase
      .from("profiles")
      .update({ mentor_status: action })
      .eq("user_id", userId);

    if (error) { toast.error("Failed to update"); }
    else {
      toast.success(`Mentor application ${action}!`);
      await loadPendingApplications();
      await loadAll();
    }
  };

  // ===== Request Mentorship =====
  const handleSendRequest = async () => {
    if (!requestingMentorId || !currentUserId) return;
    setSendingRequest(true);
    const { error } = await supabase.from("mentor_requests").insert({
      mentor_id: requestingMentorId, student_id: currentUserId, message: requestMessage.trim() || null,
    });
    if (error) {
      toast.error(error.code === "23505" ? "You already sent a request" : "Failed to send request");
    } else {
      toast.success("Mentorship request sent! 🎓");
      setRequestStatuses(prev => ({ ...prev, [requestingMentorId]: "pending" }));
    }
    setSendingRequest(false); setRequestDialogOpen(false); setRequestMessage(""); setRequestingMentorId(null);
  };

  // ===== Schedule Meeting (1:1) =====
  const handleScheduleMeeting = async () => {
    if (!schedulingMentorId) { toast.error("No mentor selected"); return; }
    if (!scheduleForm.title.trim() || !scheduleForm.scheduled_at) { toast.error("Please provide title and date/time"); return; }
    setScheduling(true);
    // ensure current session user is fresh
    const { data: { session }, error: sessErr } = await supabase.auth.getSession();
    if (sessErr) { console.error("session error:", sessErr); toast.error("Auth error"); setScheduling(false); return; }
    const authUserId = session?.user?.id || currentUserId;
    if (!authUserId) { toast.error("You must be signed in"); setScheduling(false); return; }

    const studentId = scheduleForStudentId || authUserId;
    const payload = {
      mentor_id: schedulingMentorId,
      student_id: studentId,
      title: scheduleForm.title.trim(),
      description: scheduleForm.description || null,
      meeting_link: scheduleForm.meeting_link.trim() || null,
      scheduled_at: new Date(scheduleForm.scheduled_at).toISOString(),
    };

    console.debug("scheduling payload:", payload, "authUser:", authUserId);
    const res = await supabase.from("mentor_meetings").insert(payload).select();
    if (res.error) {
      console.error("schedule meeting error:", res.error, res);
      const msg = res.error.message || res.error.details || "Failed to schedule meeting";
      toast.error(msg);
    } else {
      console.debug("schedule result:", res.data);
      toast.success("Meeting request sent! ✅");
      setScheduleDialogOpen(false);
      setScheduleForm({ title: "", meeting_link: "", scheduled_at: "" });
      setScheduleForStudentId(null);
      await loadMeetings();
    }
    setScheduling(false);
    setSchedulingMentorId(null);
  };

  const loadMeetings = async () => {
    if (!currentUserId) return;
    const { data, error } = await supabase.from("mentor_meetings").select("*").or(`mentor_id.eq.${currentUserId},student_id.eq.${currentUserId}`).order("scheduled_at", { ascending: true });
    if (error) { console.error("loadMeetings error:", error); setMeetings([]); return; }
    const ids = Array.from(new Set((data || []).flatMap(m => [m.mentor_id, m.student_id].filter(Boolean))));
    const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", ids);
    const map = {}; (profiles || []).forEach(p => { map[p.user_id] = p.name; });
    setMeetings((data || []).map(m => ({ ...m, mentor_name: map[m.mentor_id] || "Unknown", student_name: map[m.student_id] || "Unknown" })));
  };

  const handleRequestAction = async (requestId, action) => {
    const { error } = await supabase.from("mentor_requests").update({ status: action }).eq("id", requestId);
    if (error) { toast.error("Something went wrong"); }
    else { toast.success(`Request ${action}!`); await loadIncomingRequests(currentUserId); await loadMyMentees(currentUserId); }
  };

  // Cancel (delete) a scheduled meeting
  const handleCancelMeeting = async (meetingId) => {
    if (!meetingId) return;
    // confirm cancellation with user
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to cancel this meeting?')) return;
    const { error } = await supabase.from('mentor_meetings').delete().eq('id', meetingId);
    if (error) {
      console.error('cancel meeting error:', error);
      toast.error('Failed to cancel meeting');
    } else {
      toast.success('Meeting cancelled');
      await loadMeetings();
    }
  };

  if (loading) {
    return (<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>);
  }

  const MentorCard = ({ mentor }) => {
    const status = requestStatuses[mentor.user_id];
    return (
      <Card className="glass-card p-8 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 rounded-xl border border-border/50">
        <div className="cursor-pointer" onClick={() => { setSelectedProfile(mentor); setIsModalOpen(true); }}>
          <div className="flex flex-col sm:flex-row gap-6">
            <ProfileAvatar profile={mentor} currentUserId={currentUserId} size="xl" className="flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-2xl font-bold">{mentor.name || "Unknown"}</h3>
                <Badge variant="default" className="bg-gradient-to-r from-primary to-accent"><GraduationCap className="w-3 h-3 mr-1" />Verified Mentor</Badge>
              </div>
              {mentor.department && <p className="text-primary font-semibold mb-2">{mentor.department}</p>}
              {mentor.years_experience && <p className="text-sm text-muted-foreground mb-3">{mentor.years_experience} years of experience</p>}
              {mentor.mentor_expertise?.length > 0 && (
                <div className="flex items-start gap-2 mb-3">
                  <Star className="w-4 h-4 text-highlight fill-highlight mt-0.5 flex-shrink-0" />
                  <div className="flex flex-wrap gap-2">{mentor.mentor_expertise.map((exp, i) => <Badge key={i} variant="secondary" className="text-xs">{exp}</Badge>)}</div>
                </div>
              )}
              {(mentor.mentor_bio || mentor.bio) && <p className="text-muted-foreground text-sm leading-relaxed mb-4">{mentor.mentor_bio || mentor.bio}</p>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTopColor: "var(--border)", borderTopWidth: "1px" }}>
          {currentUserId && status === "accepted" ? (
            <Button size="sm" style={{ backgroundColor: "var(--success)", color: "#fff" }} className="cursor-default"><Check className="w-4 h-4 mr-2" />Your Mentor</Button>
          ) : currentUserId && status === "pending" ? (
            <Button size="sm" style={{ backgroundColor: "var(--warning)", color: "#000" }} className="cursor-default"><Clock className="w-4 h-4 mr-2" />Request Pending</Button>
          ) : currentUserId ? (
            <>
              <Button size="sm" style={{ backgroundColor: "var(--primary)", color: "#fff" }} onClick={() => { setRequestingMentorId(mentor.user_id); setRequestDialogOpen(true); }}>
                <UserPlus className="w-4 h-4 mr-2" />Request Mentorship
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setSchedulingMentorId(mentor.user_id); setScheduleDialogOpen(true); setScheduleForm({ title: `Mentorship with ${mentor.name}`, meeting_link: "", scheduled_at: "" }); }}>
                <CalendarDays className="w-4 h-4 mr-2" />Schedule Meeting
              </Button>
            </>
          ) : null}
          {mentor.email && <Button size="sm" variant="outline" asChild><a href={`mailto:${mentor.email}`}><Mail className="w-4 h-4 mr-2" />Email</a></Button>}
          {mentor.mentor_linkedin && <Button size="sm" variant="outline" asChild><a href={mentor.mentor_linkedin} target="_blank" rel="noopener noreferrer"><Linkedin className="w-4 h-4 mr-2" />LinkedIn</a></Button>}
        </div>
      </Card>
    );
  };

  const content = (
    <>
      <section className={currentUserId ? "py-10 px-6" : "pt-32 pb-20 px-6"}>
        <div className="container mx-auto">

          {/* ===== BECOME A MENTOR CTA ===== */}
          {currentUserId && !myMentorStatus && (
            <Card className="p-6 mb-10 rounded-xl" style={{ backgroundColor: "rgba(79,70,229,0.08)", borderColor: "var(--primary)", borderWidth: "1px" }}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <GraduationCap className="w-5 h-5" style={{ color: "var(--primary)" }} /> Want to become a Mentor?
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Share your knowledge and help fellow students. Your application will be reviewed by existing mentors.
                  </p>
                </div>
                <Button onClick={() => setApplyDialogOpen(true)} style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
                  <Send className="w-4 h-4 mr-2" /> Apply to be a Mentor
                </Button>
              </div>
            </Card>
          )}

          {/* Application pending banner */}
          {myMentorStatus === "pending" && (
            <Card className="p-5 mb-10 rounded-xl" style={{ backgroundColor: "rgba(234,179,8,0.1)", borderColor: "var(--warning)", borderWidth: "1px" }}>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5" style={{ color: "var(--warning)" }} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Application Under Review ⏳</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Your mentor application is being reviewed. You'll be notified once it's approved!</p>
                </div>
              </div>
            </Card>
          )}

          {myMentorStatus === "rejected" && (
            <Card className="p-5 mb-10 rounded-xl" style={{ backgroundColor: "rgba(239,68,68,0.08)", borderColor: "var(--error)", borderWidth: "1px" }}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <X className="w-5 h-5" style={{ color: "var(--error)" }} />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Application Not Approved</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>You can re-apply with updated details.</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => setApplyDialogOpen(true)} style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
                  Re-Apply
                </Button>
              </div>
            </Card>
          )}

          {/* ===== MENTOR DASHBOARD (for approved mentors) ===== */}
          {myMentorStatus === "approved" && (incomingRequests.length > 0 || myMentees.length > 0 || pendingApplications.length > 0) && (
            <Card className="glass-card p-6 mb-10 rounded-xl" style={{ borderColor: "var(--primary)", borderWidth: "1px" }}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <ShieldCheck className="w-5 h-5" style={{ color: "var(--primary)" }} /> Mentor Dashboard
              </h2>
              {/* Upcoming meetings for this mentor */}
              {meetings && meetings.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Upcoming Meetings</h3>
                  <div className="mt-2 space-y-2">
                    {(() => {
                      const VISIBLE_WINDOW_HOURS = 24 * 7; // keep meetings visible for 7 days after scheduled time
                      const visibleSince = new Date(Date.now() - VISIBLE_WINDOW_HOURS * 60 * 60 * 1000);
                      return meetings.filter(m => new Date(m.scheduled_at) >= visibleSince).map(m => {
                        const isStudentView = currentUserId && m.student_id === currentUserId;
                        const isMentorView = currentUserId && m.mentor_id === currentUserId;
                        const counterparty = isStudentView ? m.mentor_name : isMentorView ? m.student_name : (m.title || `${m.mentor_name} ↔ ${m.student_name}`);
                        return (
                          <div key={m.id} className="p-2 rounded-md" style={{ backgroundColor: "var(--bg-elevated)" }}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{counterparty}</p>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{m.mentor_name} ↔ {m.student_name} • {new Date(m.scheduled_at).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {m.meeting_link && <a href={m.meeting_link} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ backgroundColor: "var(--primary)", color: "#fff", padding: "6px 10px" }}>Join</a>}
                                {(currentUserId && currentUserId === m.mentor_id) && (
                                  <Button size="sm" variant="destructive" onClick={() => handleCancelMeeting(m.id)}>Cancel</Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
              <Tabs defaultValue={pendingApplications.length > 0 ? "verify" : incomingRequests.length > 0 ? "requests" : "mentees"}>
                <TabsList style={{ backgroundColor: "var(--bg-card)" }} className="border mb-4">
                  {pendingApplications.length > 0 && <TabsTrigger value="verify">Verify Applicants ({pendingApplications.length})</TabsTrigger>}
                  <TabsTrigger value="requests">Student Requests ({incomingRequests.length})</TabsTrigger>
                  <TabsTrigger value="mentees">My Mentees ({myMentees.length})</TabsTrigger>
                </TabsList>

                {/* Verify new mentor applications */}
                {pendingApplications.length > 0 && (
                  <TabsContent value="verify">
                    <div className="space-y-3">
                      {pendingApplications.map(app => (
                        <div key={app.user_id} className="p-4 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{app.name}</p>
                              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{app.department || "N/A"} • Year {app.year || "N/A"} • {app.years_experience || 0} yrs exp</p>
                              {app.mentor_expertise?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">{app.mentor_expertise.map((e, i) => <Badge key={i} variant="secondary" className="text-[10px]">{e}</Badge>)}</div>
                              )}
                              {app.mentor_bio && <p className="text-xs mt-2 italic" style={{ color: "var(--text-secondary)" }}>"{app.mentor_bio}"</p>}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button size="sm" style={{ backgroundColor: "var(--success)", color: "#fff" }} onClick={() => handleReviewApplication(app.user_id, "approved")}>
                                <Check className="h-3.5 w-3.5 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleReviewApplication(app.user_id, "rejected")}>
                                <X className="h-3.5 w-3.5 mr-1" /> Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="requests">
                  {incomingRequests.length === 0 ? <p className="text-sm" style={{ color: "var(--text-muted)" }}>No pending requests</p> : (
                    <div className="space-y-3">{incomingRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }}>
                        <div className="flex-1">
                          <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{req.student.name}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{req.student.department || "N/A"} • Year {req.student.year || "N/A"}</p>
                          {req.message && <p className="text-xs mt-1 italic" style={{ color: "var(--text-secondary)" }}>"{req.message}"</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" style={{ backgroundColor: "var(--success)", color: "#fff" }} onClick={() => handleRequestAction(req.id, "accepted")}><Check className="h-3.5 w-3.5 mr-1" />Accept</Button>
                          <Button size="sm" variant="outline" onClick={() => handleRequestAction(req.id, "rejected")}><X className="h-3.5 w-3.5 mr-1" />Decline</Button>
                        </div>
                      </div>
                    ))}</div>
                  )}
                </TabsContent>

                <TabsContent value="mentees">
                  {myMentees.length === 0 ? <p className="text-sm" style={{ color: "var(--text-muted)" }}>No mentees yet</p> : (
                    <div className="space-y-3">{myMentees.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }}>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{m.student.name}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{m.student.department || "N/A"} • Year {m.student.year || "N/A"}</p>
                        </div>
                        <div className="flex gap-2">
                          {m.student.email && <Button size="sm" variant="outline" asChild><a href={`mailto:${m.student.email}`}><Mail className="h-3.5 w-3.5 mr-1" />Email</a></Button>}
                                  <Button size="sm" style={{ backgroundColor: "var(--primary)", color: "#fff" }} onClick={() => navigate(`/messages?user=${m.student.user_id}`)}><MessageSquare className="h-3.5 w-3.5 mr-1" />Message</Button>
                                  <Button size="sm" variant="outline" onClick={() => { setSchedulingMentorId(currentUserId); setScheduleForStudentId(m.student.user_id); setScheduleDialogOpen(true); setScheduleForm({ title: `1:1 with ${m.student.name}`, meeting_link: "", scheduled_at: "" }); }}>
                                    <CalendarDays className="h-3.5 w-3.5 mr-1" />Schedule Meeting
                                  </Button>
                        </div>
                      </div>
                    ))}</div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          )}

          {/* Mentors Grid */}
          {meetings && meetings.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Your Upcoming Meetings</h3>
              <div className="mt-3 space-y-2">
                {(() => {
                  const VISIBLE_WINDOW_HOURS = 24 * 7; // keep meetings visible for 7 days after scheduled time
                  const visibleSince = new Date(Date.now() - VISIBLE_WINDOW_HOURS * 60 * 60 * 1000);
                  return meetings.filter(m => new Date(m.scheduled_at) >= visibleSince).map(m => {
                    const isStudentView = currentUserId && m.student_id === currentUserId;
                    const isMentorView = currentUserId && m.mentor_id === currentUserId;
                    const counterparty = isStudentView ? m.mentor_name : isMentorView ? m.student_name : (m.title || `${m.mentor_name} ↔ ${m.student_name}`);
                    return (
                      <div key={m.id} className="p-3 rounded-md" style={{ backgroundColor: "var(--bg-elevated)" }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium" style={{ color: "var(--text-primary)" }}>{counterparty}</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{m.mentor_name} ↔ {m.student_name} • {new Date(m.scheduled_at).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {m.meeting_link ? (
                              <a href={m.meeting_link} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ backgroundColor: "var(--primary)", color: "#fff", padding: "6px 10px" }}>Join</a>
                            ) : null}
                                {(currentUserId && currentUserId === m.mentor_id) && (
                                  <Button size="sm" variant="destructive" onClick={() => handleCancelMeeting(m.id)}>Cancel</Button>
                                )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
          {mentors.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: "var(--text-muted)" }} />
              <p className="text-muted-foreground text-lg mb-2">No verified mentors available yet.</p>
              <p className="text-muted-foreground text-sm">Be the first to apply!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 mb-12">{mentors.map(m => <MentorCard key={m.id} mentor={m} />)}</div>
          )}
        </div>
      </section>

      {/* ===== Apply to be Mentor Dialog ===== */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }} className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: "var(--text-primary)" }}>Apply to be a Mentor 🎓</DialogTitle>
          </DialogHeader>
          <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
            Fill in your mentoring details. Your application will be reviewed by existing verified mentors before you're listed.
          </p>
          <div className="space-y-4">
            <div>
              <Label style={{ color: "var(--text-primary)" }} className="text-sm font-medium">Expertise Areas *</Label>
              <div className="mt-1">
                <SkillsInput skills={applyForm.expertise} onChange={(v) => setApplyForm(f => ({ ...f, expertise: v }))} placeholder="Add expertise (e.g., React, Machine Learning)" />
              </div>
            </div>
            <div>
              <Label style={{ color: "var(--text-primary)" }} className="text-sm font-medium">Mentor Bio *</Label>
              <Textarea value={applyForm.bio} onChange={(e) => setApplyForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell students about your experience and mentoring approach..." rows={3} className="mt-1" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label style={{ color: "var(--text-primary)" }} className="text-sm font-medium">LinkedIn URL</Label>
                <Input value={applyForm.linkedin} onChange={(e) => setApplyForm(f => ({ ...f, linkedin: e.target.value }))} placeholder="linkedin.com/in/..." className="mt-1" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <Label style={{ color: "var(--text-primary)" }} className="text-sm font-medium">Years of Experience</Label>
                <Input type="number" min="0" value={applyForm.experience} onChange={(e) => setApplyForm(f => ({ ...f, experience: e.target.value }))} placeholder="3" className="mt-1" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
              </div>
            </div>
            <Button onClick={handleApply} disabled={applySubmitting} className="w-full" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
              {applySubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

        {/* Schedule Meeting Dialog */}
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }} className="max-w-lg">
            <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>Schedule 1:1 Meeting</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label style={{ color: "var(--text-primary)" }} className="text-sm font-medium">Meeting Title *</Label>
                <Input value={scheduleForm.title} onChange={(e) => setScheduleForm(f => ({ ...f, title: e.target.value }))} placeholder="Quick sync about project" className="mt-1" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <Label style={{ color: "var(--text-primary)" }} className="text-sm font-medium">Meeting Link</Label>
                <Input value={scheduleForm.meeting_link} onChange={(e) => setScheduleForm(f => ({ ...f, meeting_link: e.target.value }))} placeholder="https://meet.google.com/..." className="mt-1" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <Label style={{ color: "var(--text-primary)" }} className="text-sm font-medium">When *</Label>
                <Input type="datetime-local" value={scheduleForm.scheduled_at} onChange={(e) => setScheduleForm(f => ({ ...f, scheduled_at: e.target.value }))} className="mt-1" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <Label style={{ color: "var(--text-primary)" }} className="text-sm font-medium">Notes</Label>
                <Textarea value={scheduleForm.description} onChange={(e) => setScheduleForm(f => ({ ...f, description: e.target.value }))} placeholder="Agenda or points to discuss" rows={3} className="mt-1" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
              </div>
              <Button onClick={handleScheduleMeeting} disabled={scheduling} className="w-full" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
                {scheduling ? "Scheduling..." : "Send Meeting Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      {/* Request Mentorship Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>Request Mentorship 🎓</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Send a short message explaining why you'd like this mentor's guidance.</p>
            <Textarea value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} placeholder="Hi! I'd love your help with..." rows={4} style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
            <Button onClick={handleSendRequest} disabled={sendingRequest} className="w-full" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
              {sendingRequest ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProfileModal profile={selectedProfile} currentUserId={currentUserId} open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );

  if (currentUserId) return <AppLayout>{content}</AppLayout>;
  return <div className="min-h-screen"><Navbar />{content}<Footer /></div>;
};

export default Mentors;
