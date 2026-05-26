import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Save, Users, GraduationCap, Pencil, X, MapPin, Calendar,
  Github, Linkedin, Globe, Code2, ExternalLink, Sparkles, BookOpen,
  ArrowLeft, Mail, TrendingUp
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SkillsInput from "@/components/SkillsInput";
import ProfilePhotoManager from "@/components/ProfilePhotoManager";
import AppLayout from "@/components/layouts/AppLayout";

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [userId, setUserId] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoVisible, setProfilePhotoVisible] = useState(true);
  const [profile, setProfile] = useState({
    name: "", email: "", department: "", year: "", bio: "", domain: "",
    github_url: "", linkedin_url: "", leetcode_url: "", codeforces_url: "",
    portfolio_url: "", skills: [], interests: [],
  });

  useEffect(() => {
    loadProfile();
  }, []);

  // If setup=1, go directly to edit mode
  useEffect(() => {
    if (searchParams.get("setup") === "1") setEditing(true);
  }, [searchParams]);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    setUserId(session.user.id);

    const { data, error } = await supabase
      .from("profiles").select("*").eq("user_id", session.user.id).single();

    if (error) { toast.error("Error loading profile"); setLoading(false); return; }

    const { count } = await supabase
      .from("connections").select("*", { count: 'exact', head: true })
      .eq("status", "accepted")
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);

    setConnectionsCount(count || 0);

    if (data) {
      setProfilePhoto(data.profile_photo);
      setProfilePhotoVisible(data.profile_photo_visible ?? true);
      setProfile({
        name: data.name || "", email: data.email || "",
        department: data.department || "", year: data.year?.toString() || "",
        bio: data.bio || "", domain: data.domain || "",
        github_url: data.github_url || "", linkedin_url: data.linkedin_url || "",
        leetcode_url: data.leetcode_url || "", codeforces_url: data.codeforces_url || "",
        portfolio_url: data.portfolio_url || "",
        skills: data.skills || [], interests: data.interests || [],
      });
    }
    setLoading(false);
  };

  // Mock analytics data
  const analyticsData = [
    { month: 'Jan', views: 24, connections: 5 },
    { month: 'Feb', views: 45, connections: 12 },
    { month: 'Mar', views: 88, connections: 25 },
    { month: 'Apr', views: 142, connections: 42 },
    { month: 'May', views: 256, connections: connectionsCount > 42 ? connectionsCount : 58 },
  ];

  const handleSave = async () => {
    if (!profile.name || profile.name.trim() === "") {
      toast.error("Full Name is required"); return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); setSaving(false); return; }

    const updateData = {
      name: profile.name, department: profile.department || null,
      year: profile.year ? parseInt(profile.year) : null,
      bio: profile.bio || null, domain: profile.domain || null,
      github_url: profile.github_url || null, linkedin_url: profile.linkedin_url || null,
      leetcode_url: profile.leetcode_url || null, codeforces_url: profile.codeforces_url || null,
      portfolio_url: profile.portfolio_url || null,
      skills: profile.skills || [], interests: profile.interests || [],
    };

    const { error } = await supabase.from("profiles").update(updateData).eq("user_id", session.user.id).select();

    if (error) {
      console.error("Profile update error:", error);
      toast.error(`Error saving profile: ${error.message || 'Unknown error'}`);
      setSaving(false); return;
    }

    toast.success("Profile updated successfully!");
    if (searchParams.get("setup") === "1") { navigate("/dashboard"); return; }
    setSaving(false);
    setEditing(false);
  };

  const handleChange = (e) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSkillsChange = (skills) => setProfile(prev => ({ ...prev, skills }));
  const handleInterestsChange = (interests) => setProfile(prev => ({ ...prev, interests }));

  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
      </div>
    );
  }

  // Get avatar initials
  const initials = (profile.name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  // Social links for overview
  const socialLinks = [
    { url: profile.github_url, icon: <Github size={16} />, label: "GitHub" },
    { url: profile.linkedin_url, icon: <Linkedin size={16} />, label: "LinkedIn" },
    { url: profile.leetcode_url, icon: <Code2 size={16} />, label: "LeetCode" },
    { url: profile.codeforces_url, icon: <Code2 size={16} />, label: "Codeforces" },
    { url: profile.portfolio_url, icon: <Globe size={16} />, label: "Portfolio" },
  ].filter(l => l.url);

  /* ═══════════════════════ OVERVIEW MODE ═══════════════════════ */
  if (!editing) {
    return (
      <AppLayout>
        <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }} className="p-6">
          <div className="max-w-3xl mx-auto">

            {/* ── Hero Card ── */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Gradient banner */}
              <div style={{
                height: 140,
                background: 'linear-gradient(135deg, var(--primary), #818CF8, #38BDF8)',
                position: 'relative',
              }}>
                {/* Edit button on banner */}
                <Button
                  onClick={() => setEditing(true)}
                  size="sm"
                  style={{
                    position: 'absolute', top: 16, right: 16,
                    backgroundColor: 'rgba(0,0,0,0.35)', color: '#fff',
                    backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Profile
                </Button>
              </div>

              {/* Avatar + Info */}
              <div style={{ padding: '0 32px 32px', marginTop: -52 }}>
                {/* Avatar */}
                <div style={{
                  width: 104, height: 104, borderRadius: '50%',
                  border: '4px solid var(--bg-card)',
                  overflow: 'hidden', position: 'relative',
                  background: profilePhoto ? 'transparent' : 'linear-gradient(135deg, var(--primary), #818CF8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}>
                  {profilePhoto ? (
                    <img src={profilePhoto} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>{initials}</span>
                  )}
                </div>

                {/* Name & meta */}
                <div style={{ marginTop: 16 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 }}>
                    {profile.name || "Your Name"}
                  </h1>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                    {profile.department && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: 'var(--text-secondary)' }}>
                        <MapPin size={14} style={{ color: 'var(--primary)' }} /> {profile.department}
                      </span>
                    )}
                    {profile.year && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: 'var(--text-secondary)' }}>
                        <Calendar size={14} style={{ color: 'var(--primary)' }} /> Year {profile.year}
                      </span>
                    )}
                    {profile.email && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: 'var(--text-secondary)' }}>
                        <Mail size={14} style={{ color: 'var(--primary)' }} /> {profile.email}
                      </span>
                    )}
                  </div>

                  {profile.domain && (
                    <Badge style={{
                      background: 'rgba(99,102,241,0.12)', color: 'var(--primary)',
                      border: '1px solid rgba(99,102,241,0.25)', fontSize: 12, padding: '4px 12px',
                    }}>
                      <Sparkles size={12} style={{ marginRight: 4 }} /> {profile.domain}
                    </Badge>
                  )}
                </div>

                {/* Stats row */}
                <div style={{
                  display: 'flex', gap: 24, marginTop: 20, paddingTop: 20,
                  borderTop: '1px solid var(--border)',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{connectionsCount}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Connections</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{profile.skills?.length || 0}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Skills</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{socialLinks.length}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Links</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Bio Section ── */}
            {profile.bio && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '24px 28px', marginTop: 16,
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>About</h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{profile.bio}</p>
              </div>
            )}

            {/* ── Skills & Interests ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              {/* Skills */}
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '24px 28px',
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Code2 size={14} /> Skills
                </h3>
                {profile.skills?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {profile.skills.map((s, i) => (
                      <span key={i} style={{
                        padding: '5px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500,
                        background: 'rgba(99,102,241,0.1)', color: 'var(--primary)',
                        border: '1px solid rgba(99,102,241,0.2)',
                      }}>{s}</span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No skills added yet</p>
                )}
              </div>

              {/* Interests */}
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '24px 28px',
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={14} /> Interests
                </h3>
                {profile.interests?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {profile.interests.map((s, i) => (
                      <span key={i} style={{
                        padding: '5px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500,
                        background: 'rgba(56,189,248,0.1)', color: '#38BDF8',
                        border: '1px solid rgba(56,189,248,0.2)',
                      }}>{s}</span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No interests added yet</p>
                )}
              </div>
            </div>

            {/* ── Social Links ── */}
            {socialLinks.length > 0 && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '24px 28px', marginTop: 16,
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Globe size={14} /> Links
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {socialLinks.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        color: 'var(--text-secondary)', textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      {link.icon} {link.label} <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── Analytics Graph ── */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '24px 28px', marginTop: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={14} /> Profile Growth
                </h3>
                <Badge style={{ background: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: 'none' }}>+124% this month</Badge>
              </div>
              
              <div style={{ height: 260, width: '100%', marginLeft: -15 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dx={-10} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      itemStyle={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}
                      labelStyle={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}
                    />
                    <Area type="monotone" dataKey="views" name="Profile Views" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                    <Area type="monotone" dataKey="connections" name="Connections" stroke="#38BDF8" strokeWidth={3} fillOpacity={1} fill="url(#colorConn)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </AppLayout>
    );
  }

  /* ═══════════════════════ EDIT MODE ═══════════════════════ */
  return (
    <AppLayout>
      <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }} className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {searchParams.get("setup") === "1" ? "Complete Your Profile" : "Edit Profile"}
              </h1>
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                {searchParams.get("setup") === "1"
                  ? "Finish your basic details first so discovery, projects, and matching work properly."
                  : "Update your information to help teammates find you"}
              </p>
            </div>
            {searchParams.get("setup") !== "1" && (
              <Button variant="outline" onClick={() => setEditing(false)}
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            )}
          </div>

          {/* Photo Manager */}
          <ProfilePhotoManager
            profilePhoto={profilePhoto}
            profilePhotoVisible={profilePhotoVisible}
            userName={profile.name}
            userId={userId}
            onPhotoUpdate={loadProfile}
          />

          {/* Form Section */}
          <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} className="border rounded-lg p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h2 style={{ color: 'var(--text-primary)' }} className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" style={{ color: 'var(--text-primary)' }} className="font-medium">Full Name *</Label>
                  <Input id="name" name="name" value={profile.name} onChange={handleChange} placeholder="John Doe" className="mt-2"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <Label htmlFor="email" style={{ color: 'var(--text-primary)' }} className="font-medium">Email</Label>
                  <Input id="email" name="email" value={profile.email} disabled className="mt-2"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <Label htmlFor="department" style={{ color: 'var(--text-primary)' }} className="font-medium">Department/Branch</Label>
                  <Input id="department" name="department" value={profile.department} onChange={handleChange} placeholder="Computer Science" className="mt-2"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <Label htmlFor="year" style={{ color: 'var(--text-primary)' }} className="font-medium">Year</Label>
                  <Input id="year" name="year" type="number" value={profile.year} onChange={handleChange} placeholder="2" className="mt-2"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>
              </div>
            </div>

            {/* Bio & Domain */}
            <div style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }} className="pt-6">
              <h2 style={{ color: 'var(--text-primary)' }} className="text-xl font-semibold mb-4">About You</h2>
              <div>
                <Label htmlFor="bio" style={{ color: 'var(--text-primary)' }} className="font-medium">Bio</Label>
                <Textarea id="bio" name="bio" value={profile.bio} onChange={handleChange} placeholder="Tell us about yourself..." className="mt-2" rows={4}
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div className="mt-4">
                <Label htmlFor="domain" style={{ color: 'var(--text-primary)' }} className="font-medium">Domain/Interest Area</Label>
                <Input id="domain" name="domain" value={profile.domain} onChange={handleChange} placeholder="Web Development, AI/ML, etc." className="mt-2"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            {/* Skills & Interests */}
            <div style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }} className="pt-6">
              <h2 style={{ color: 'var(--text-primary)' }} className="text-xl font-semibold mb-4">Skills & Interests</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="skills" style={{ color: 'var(--text-primary)' }} className="font-medium">Skills</Label>
                  <div className="mt-2">
                    <SkillsInput skills={profile.skills} onChange={handleSkillsChange} placeholder="Add a skill (e.g., React, Python)" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="interests" style={{ color: 'var(--text-primary)' }} className="font-medium">Interests</Label>
                  <div className="mt-2">
                    <SkillsInput skills={profile.interests} onChange={handleInterestsChange} placeholder="Add an interest (e.g., Web Development)" />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }} className="pt-6">
              <h2 style={{ color: 'var(--text-primary)' }} className="text-xl font-semibold mb-4">Social Links</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { id: "github_url", label: "GitHub URL", ph: "https://github.com/username" },
                  { id: "linkedin_url", label: "LinkedIn URL", ph: "https://linkedin.com/in/username" },
                  { id: "leetcode_url", label: "LeetCode URL", ph: "https://leetcode.com/username" },
                  { id: "codeforces_url", label: "Codeforces URL", ph: "https://codeforces.com/profile/username" },
                  { id: "portfolio_url", label: "Portfolio URL", ph: "https://yourportfolio.com" },
                ].map(f => (
                  <div key={f.id}>
                    <Label htmlFor={f.id} style={{ color: 'var(--text-primary)' }} className="font-medium">{f.label}</Label>
                    <Input id={f.id} name={f.id} value={profile[f.id]} onChange={handleChange} placeholder={f.ph} className="mt-2"
                      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-6">
                <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: 'var(--primary)', color: '#fff' }}>
                  <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
                </Button>
                {searchParams.get("setup") !== "1" && (
                  <Button onClick={() => setEditing(false)} variant="outline" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
