import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarPlus, ExternalLink, Trash2, Video, Clock } from "lucide-react";
import { toast } from "sonner";

const ProjectMeetings = ({ projectId, currentUserId, isOwner }) => {
  const [meetings, setMeetings] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", meeting_link: "", scheduled_at: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    loadMeetings();

    const channel = supabase
      .channel(`project-meetings-${projectId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "project_meetings", filter: `project_id=eq.${projectId}` },
        () => loadMeetings()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  const loadMeetings = async () => {
    const { data } = await supabase
      .from("project_meetings")
      .select("*")
      .eq("project_id", projectId)
      .order("scheduled_at", { ascending: true });
    setMeetings(data || []);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.meeting_link.trim() || !form.scheduled_at) {
      toast.error("Please fill title, link and date/time");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("project_meetings").insert({
      project_id: projectId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      meeting_link: form.meeting_link.trim(),
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      created_by: currentUserId,
    });
    if (error) {
      toast.error("Failed to schedule meeting");
      console.error(error);
    } else {
      toast.success("Meeting scheduled! 🎉");
      setForm({ title: "", description: "", meeting_link: "", scheduled_at: "" });
      setOpen(false);
    }
    setSubmitting(false);
  };

  const handleDelete = async (meetingId) => {
    const { error } = await supabase.from("project_meetings").delete().eq("id", meetingId);
    if (error) toast.error("Failed to delete");
    else { toast.success("Meeting removed"); loadMeetings(); }
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };
  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getValidUrl = (url) => {
    if (!url) return "#";
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return "https://" + url;
    }
    return url;
  };

  const now = new Date();
  const upcoming = meetings.filter(m => new Date(m.scheduled_at) >= now);
  const past = meetings.filter(m => new Date(m.scheduled_at) < now);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 style={{ color: "var(--text-primary)" }} className="text-lg font-semibold">Team Meetings</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
              <CalendarPlus className="h-4 w-4 mr-2" /> Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <DialogHeader>
              <DialogTitle style={{ color: "var(--text-primary)" }}>Schedule a Meeting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Meeting Title (e.g. Sprint Review)" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
              <Textarea placeholder="Description (optional)" value={form.description} rows={2}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
              <Input placeholder="Meeting Link (e.g. meet.google.com/xyz)" value={form.meeting_link}
                onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))}
                style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
              <Input type="datetime-local" value={form.scheduled_at}
                onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
              <Button onClick={handleCreate} disabled={submitting} className="w-full" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
                {submitting ? "Scheduling..." : "Schedule Meeting"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Meetings */}
      {upcoming.length === 0 && past.length === 0 && (
        <div className="text-center py-12">
          <Video className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
          <p style={{ color: "var(--text-muted)" }} className="text-sm">No meetings scheduled yet</p>
          <p style={{ color: "var(--text-muted)" }} className="text-xs mt-1">Click "Schedule Meeting" to create one</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--primary)" }}>Upcoming</p>
          <div className="space-y-3">
            {upcoming.map(m => (
              <Card key={m.id} className="p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{m.title}</h4>
                    {m.description && <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{m.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        <Clock className="h-3 w-3" /> {formatDate(m.scheduled_at)} at {formatTime(m.scheduled_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={getValidUrl(m.meeting_link)} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" style={{ backgroundColor: "var(--success)", color: "#fff" }}>
                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> Join
                      </Button>
                    </a>
                    {(isOwner || m.created_by === currentUserId) && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                        <Trash2 className="h-3.5 w-3.5" style={{ color: "var(--error)" }} />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Past Meetings</p>
          <div className="space-y-2">
            {past.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg opacity-60" style={{ backgroundColor: "var(--bg-elevated)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(m.scheduled_at)} at {formatTime(m.scheduled_at)}</p>
                </div>
                {(isOwner || m.created_by === currentUserId) && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" style={{ color: "var(--error)" }} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMeetings;
