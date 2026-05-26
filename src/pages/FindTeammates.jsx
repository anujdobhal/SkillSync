import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, Search, Github, Linkedin, Code, Check, Clock, UserPlus, GraduationCap, Folder } from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ProfileModal } from "@/components/ProfileModal";
import AppLayout from "@/components/layouts/AppLayout";

const FindTeammates = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const [activeTab, setActiveTab] = useState("teammates");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    let filtered = [];
    if (activeTab === "teammates") {
      filtered = profiles;
    } else if (activeTab === "mentors") {
      filtered = mentors;
    } else {
      filtered = projects;
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        if (activeTab === "projects") {
          return (
            item.title?.toLowerCase().includes(searchLower) ||
            item.domain?.toLowerCase().includes(searchLower) ||
            item.description?.toLowerCase().includes(searchLower) ||
            item.required_skills?.some(skill => skill.toLowerCase().includes(searchLower))
          );
        } else {
          return (
            item.name?.toLowerCase().includes(searchLower) ||
            item.department?.toLowerCase().includes(searchLower) ||
            item.domain?.toLowerCase().includes(searchLower) ||
            item.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
            (activeTab === "mentors" && item.mentor_expertise?.some(exp => exp.toLowerCase().includes(searchLower)))
          );
        }
      });
    }

    // Apply department filter
    if (departmentFilter !== "all" && activeTab !== "projects") {
      filtered = filtered.filter(profile => profile.department === departmentFilter);
    }

    // Apply domain filter
    if (domainFilter !== "all") {
      filtered = filtered.filter(item => item.domain === domainFilter);
    }

    if (activeTab === "teammates") {
      setFilteredProfiles(filtered);
    } else if (activeTab === "mentors") {
      setFilteredMentors(filtered);
    } else {
      setFilteredProjects(filtered);
    }
  }, [searchTerm, profiles, mentors, projects, departmentFilter, domainFilter, activeTab]);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setCurrentUserId(session.user.id);

    try {
      // 1. Fetch profiles
      const { data: profilesData, error: profilesErr } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", session.user.id);

      if (profilesErr) throw profilesErr;

      // 2. Fetch projects not created by me
      const { data: projectsData, error: projectsErr } = await supabase
        .from("projects")
        .select("*")
        .neq("creator_id", session.user.id)
        .eq("is_public", true);

      if (projectsErr) throw projectsErr;

      // 3. Fetch connection statuses
      const { data: connections, error: connErr } = await supabase
        .from("connections")
        .select("receiver_id, sender_id, status")
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);

      if (connErr) throw connErr;

      const statuses = {};
      const excludedIds = new Set();
      connections?.forEach(conn => {
        const otherUserId = conn.sender_id === session.user.id ? conn.receiver_id : conn.sender_id;
        statuses[otherUserId] = conn.status;
        // Exclude users who are already connected or have a pending request
        if (conn.status === "accepted" || conn.status === "pending") {
          excludedIds.add(otherUserId);
        }
      });
      setConnectionStatuses(statuses);

      // Separate teammates and mentors
      const teammates = (profilesData || []).filter(p => !p.is_mentor && !excludedIds.has(p.user_id));
      const mentorsList = (profilesData || []).filter(p => p.is_mentor === true && !excludedIds.has(p.user_id));

      setProfiles(teammates);
      setMentors(mentorsList);
      setProjects(projectsData || []);

      setFilteredProfiles(teammates);
      setFilteredMentors(mentorsList);
      setFilteredProjects(projectsData || []);
    } catch (err) {
      console.error(err);
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId) => {
    const { data: existing } = await supabase
      .from("connections")
      .select("*")
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`)
      .single();

    if (existing) {
      toast.error("Connection request already exists");
      return;
    }

    const { error } = await supabase
      .from("connections")
      .insert({
        sender_id: currentUserId,
        receiver_id: userId,
        status: "pending"
      });

    if (error) {
      toast.error("Error sending connection request");
      return;
    }

    setConnectionStatuses(prev => ({ ...prev, [userId]: "pending" }));
    toast.success("Connection request sent!");
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
      </div>
    );
  }

  const allItems = activeTab === "teammates" ? profiles : (activeTab === "mentors" ? mentors : projects);
  const departments = activeTab !== "projects" ? Array.from(new Set(allItems.map(p => p.department).filter(Boolean))) : [];
  const domains = Array.from(new Set(allItems.map(p => p.domain).filter(Boolean)));

  const ProjectDiscoverCard = ({ p }) => (
    <div 
      key={p.id}
      style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border)',
        borderRadius: 20
      }}
      className="p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 group cursor-pointer relative overflow-hidden"
      onClick={() => navigate(`/project/${p.id}`)}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Decorative gradient blob */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, transparent 60%)', opacity: 0.1, pointerEvents: 'none' }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 style={{ color: 'var(--text-primary)', lineHeight: 1.3 }} className="text-xl font-bold line-clamp-2 flex-1">
            {p.title}
          </h3>
          <Badge style={{ backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.2)', borderWidth: '1px', color: 'var(--primary)' }} className="whitespace-nowrap flex-shrink-0 text-xs px-2.5 py-0.5">
            {p.domain || "General"}
          </Badge>
        </div>

        {p.description && (
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mb-5 line-clamp-3 leading-relaxed">
            {p.description}
          </p>
        )}

        {p.required_skills && p.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {p.required_skills.slice(0, 3).map((skill, idx) => (
              <span key={idx} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {skill}
              </span>
            ))}
            {p.required_skills.length > 3 && (
              <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                +{p.required_skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t relative z-10" style={{ borderColor: 'var(--border)' }}>
        <span style={{ color: 'var(--text-muted)' }} className="text-xs font-medium flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Size: {p.max_team_size || 5}
        </span>
        <Button 
          style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
          size="sm"
          className="text-xs rounded-lg px-4 hover:opacity-90"
        >
          View & Join
        </Button>
      </div>
    </div>
  );

  const ProfileCard = ({ profile }) => {
    const status = connectionStatuses[profile.user_id];
    
    return (
      <div 
        key={profile.id}
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}
        className="p-6 transition-all duration-300 hover:-translate-y-1.5 group flex flex-col h-full relative overflow-hidden"
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Subtle accent glow */}
        <div style={{ position: 'absolute', top: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #38BDF8 0%, transparent 70%)', opacity: 0.1, pointerEvents: 'none' }} />

        <div className="cursor-pointer relative z-10 flex-1" onClick={() => { setSelectedProfile(profile); setIsModalOpen(true); }}>
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0" style={{ padding: 2, background: 'linear-gradient(135deg, var(--primary), #38BDF8)', borderRadius: '50%' }}>
              <div style={{ border: '2px solid var(--bg-card)', borderRadius: '50%', overflow: 'hidden' }}>
                <ProfileAvatar profile={profile} currentUserId={currentUserId} size="lg" />
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-bold truncate">
                  {profile.name || "Unknown"}
                </h3>
                {profile.is_mentor && (
                  <Badge style={{ backgroundColor: 'var(--primary)', color: '#fff' }} className="flex-shrink-0 px-1.5 py-0">
                    <GraduationCap className="w-3 h-3" />
                  </Badge>
                )}
              </div>
              {profile.department && (
                <p style={{ color: '#38BDF8' }} className="text-xs font-semibold mb-0.5 truncate">{profile.department}</p>
              )}
              {profile.year && (
                <p style={{ color: 'var(--text-muted)' }} className="text-xs">Year {profile.year}</p>
              )}
            </div>
          </div>

          {profile.bio && (
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm mb-4 line-clamp-2 leading-relaxed">{profile.bio}</p>
          )}

          {profile.domain && (
            <div className="mb-4">
              <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, backgroundColor: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38BDF8' }}>
                {profile.domain}
              </span>
            </div>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {profile.skills.slice(0, 3).map((skill, idx) => (
                <span key={idx} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: 'var(--primary)' }}>
                  {skill}
                </span>
              ))}
              {profile.skills.length > 3 && (
                <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  +{profile.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-auto relative z-10 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          {status === "accepted" ? (
            <Button style={{ backgroundColor: 'var(--success)', color: '#fff' }} className="flex-1 cursor-default rounded-lg">
              <Check className="w-4 h-4 mr-2" /> Connected
            </Button>
          ) : status === "pending" ? (
            <Button style={{ backgroundColor: 'var(--warning)', color: '#000' }} className="flex-1 cursor-default rounded-lg">
              <Clock className="w-4 h-4 mr-2" /> Pending
            </Button>
          ) : (
            <Button 
              style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
              className="flex-1 rounded-lg hover:opacity-90"
              onClick={() => handleConnect(profile.user_id)}
            >
              <UserPlus className="w-4 h-4 mr-2" /> Connect
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }} className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 style={{ color: 'var(--text-primary)' }} className="text-3xl font-bold mb-2">
              Discover
            </h1>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
              Explore projects to join, connect with talented students, or find mentors
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList style={{ backgroundColor: 'var(--bg-card)' }} className="grid grid-cols-3 w-full border border-b">
              <TabsTrigger value="teammates">Teammates</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="mentors">Mentors</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <Input
                placeholder={activeTab === "projects" ? "Search by project name, skills..." : "Search by name, skills..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {activeTab !== "projects" && departments.length > 0 && (
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {domains.length > 0 && (
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  <SelectValue placeholder="All Domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {domains.map(domain => (
                    <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Profiles Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === "teammates" ? filteredProfiles : (activeTab === "mentors" ? filteredMentors : filteredProjects)).length === 0 ? (
              <div className="col-span-full text-center py-12">
                {activeTab === "projects" ? (
                  <Folder className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <User className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                )}
                <p style={{ color: 'var(--text-muted)' }} className="text-lg">
                  No {activeTab} found matching your criteria
                </p>
              </div>
            ) : (
              activeTab === "teammates" 
                ? filteredProfiles.map(profile => <ProfileCard key={profile.user_id} profile={profile} />)
                : activeTab === "mentors"
                  ? filteredMentors.map(profile => <ProfileCard key={profile.user_id} profile={profile} />)
                  : filteredProjects.map(proj => <ProjectDiscoverCard key={proj.id} p={proj} />)
            )}
          </div>
        </div>
      </div>

      <ProfileModal 
        profile={selectedProfile}
        currentUserId={currentUserId}
        connectionStatus={selectedProfile ? connectionStatuses[selectedProfile.user_id] : undefined}
        onConnect={handleConnect}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </AppLayout>
  );
};

export default FindTeammates;
