import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Search, Github, Linkedin, Code, Check, Clock, UserPlus, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ProfileModal } from "@/components/ProfileModal";

const FindTeammates = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("teammates");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    checkAuthAndLoadProfiles();
  }, []);

  useEffect(() => {
    let filtered = activeTab === "teammates" ? profiles : mentors;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(profile => {
        const searchLower = searchTerm.toLowerCase();
        return (
          profile.name?.toLowerCase().includes(searchLower) ||
          profile.department?.toLowerCase().includes(searchLower) ||
          profile.domain?.toLowerCase().includes(searchLower) ||
          profile.skills?.some((skill: string) => skill.toLowerCase().includes(searchLower)) ||
          (activeTab === "mentors" && profile.mentor_expertise?.some((exp: string) => exp.toLowerCase().includes(searchLower)))
        );
      });
    }

    // Apply department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter(profile => profile.department === departmentFilter);
    }

    // Apply domain filter
    if (domainFilter !== "all") {
      filtered = filtered.filter(profile => profile.domain === domainFilter);
    }

    if (activeTab === "teammates") {
      setFilteredProfiles(filtered);
    } else {
      setFilteredMentors(filtered);
    }
  }, [searchTerm, profiles, mentors, departmentFilter, domainFilter, activeTab]);

  const checkAuthAndLoadProfiles = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setCurrentUserId(session.user.id);

    // Fetch all profiles except current user
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("user_id", session.user.id);

    if (error) {
      toast.error("Error loading profiles");
      setLoading(false);
      return;
    }

    // Fetch connection statuses
    const { data: connections } = await supabase
      .from("connections")
      .select("receiver_id, sender_id, status")
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);

    const statuses: Record<string, string> = {};
    connections?.forEach(conn => {
      const otherUserId = conn.sender_id === session.user.id ? conn.receiver_id : conn.sender_id;
      statuses[otherUserId] = conn.status;
    });
    setConnectionStatuses(statuses);

    // Separate teammates and mentors
    const teammates = (data || []).filter(p => !p.is_mentor);
    const mentorsList = (data || []).filter(p => p.is_mentor === true);

    setProfiles(teammates);
    setMentors(mentorsList);
    setFilteredProfiles(teammates);
    setFilteredMentors(mentorsList);
    setLoading(false);
  };

  const handleConnect = async (userId: string) => {
    // Check if connection already exists
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

  const allProfiles = activeTab === "teammates" ? profiles : mentors;
  const departments = Array.from(new Set(allProfiles.map(p => p.department).filter(Boolean)));
  const domains = Array.from(new Set(allProfiles.map(p => p.domain).filter(Boolean)));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Find People</h1>
            <p className="text-muted-foreground">Connect with students who share your interests and skills</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="teammates">
                <User className="w-4 h-4 mr-2" />
                Find Teammates
              </TabsTrigger>
              <TabsTrigger value="mentors">
                <GraduationCap className="w-4 h-4 mr-2" />
                Find Mentors
              </TabsTrigger>
            </TabsList>

            <TabsContent value="teammates" className="mt-6">
              <div className="mb-8 space-y-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by name, skills, department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex gap-4">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={domainFilter} onValueChange={setDomainFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Domains</SelectItem>
                      {domains.map(domain => (
                        <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground text-lg">No teammates found. Try adjusting your search.</p>
                  </div>
                ) : (
                  filteredProfiles.map((profile) => (
                    <Card 
                      key={profile.id} 
                      className="glass-card p-6 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-xl border border-border/50"
                      onClick={() => {
                        setSelectedProfile(profile);
                        setIsModalOpen(true);
                      }}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <ProfileAvatar 
                          profile={profile} 
                          currentUserId={currentUserId} 
                          size="lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold truncate">{profile.name || "Unknown User"}</h3>
                          {profile.department && (
                            <p className="text-sm text-muted-foreground">{profile.department}</p>
                          )}
                          {profile.year && (
                            <p className="text-sm text-muted-foreground">Year {profile.year}</p>
                          )}
                        </div>
                      </div>

                      {profile.bio && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{profile.bio}</p>
                      )}

                      {profile.domain && (
                        <div className="mb-4">
                          <span className="text-xs font-semibold text-muted-foreground">Domain:</span>
                          <Badge className="ml-2">{profile.domain}</Badge>
                        </div>
                      )}

                      {profile.skills && profile.skills.length > 0 && (
                        <div className="mb-4">
                          <span className="text-xs font-semibold text-muted-foreground block mb-2">Skills:</span>
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.slice(0, 3).map((skill: string, idx: number) => (
                              <Badge key={idx} variant="secondary">{skill}</Badge>
                            ))}
                            {profile.skills.length > 3 && (
                              <Badge variant="outline">+{profile.skills.length - 3}</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mb-4">
                        {profile.github_url && (
                          <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <Github className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {profile.linkedin_url && (
                          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <Linkedin className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {profile.leetcode_url && (
                          <a href={profile.leetcode_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <Code className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>

                      {connectionStatuses[profile.user_id] === "accepted" ? (
                        <Button 
                          disabled
                          variant="outline"
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Connected
                        </Button>
                      ) : connectionStatuses[profile.user_id] === "pending" ? (
                        <Button 
                          disabled
                          variant="outline"
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Pending
                        </Button>
                      ) : (
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnect(profile.user_id);
                          }}
                          className="w-full bg-gradient-to-r from-primary to-accent text-white"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="mentors" className="mt-6">
              <div className="mb-8 space-y-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search mentors by name, expertise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex gap-4">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={domainFilter} onValueChange={setDomainFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Domains</SelectItem>
                      {domains.map(domain => (
                        <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentors.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground text-lg">No mentors found. Try adjusting your search.</p>
                  </div>
                ) : (
                  filteredMentors.map((mentor) => (
                    <Card 
                      key={mentor.id} 
                      className="glass-card p-6 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-xl border border-border/50"
                      onClick={() => {
                        setSelectedProfile(mentor);
                        setIsModalOpen(true);
                      }}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <ProfileAvatar 
                          profile={mentor} 
                          currentUserId={currentUserId} 
                          size="lg"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-xl font-semibold truncate">{mentor.name || "Unknown Mentor"}</h3>
                            <Badge variant="default" className="bg-gradient-to-r from-primary to-accent text-xs">
                              <GraduationCap className="w-3 h-3 mr-1" />
                              Mentor
                            </Badge>
                          </div>
                          {mentor.department && (
                            <p className="text-sm text-muted-foreground">{mentor.department}</p>
                          )}
                          {mentor.years_experience && (
                            <p className="text-sm text-muted-foreground">{mentor.years_experience} years experience</p>
                          )}
                        </div>
                      </div>

                      {mentor.mentor_bio && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{mentor.mentor_bio}</p>
                      )}

                      {mentor.mentor_expertise && mentor.mentor_expertise.length > 0 && (
                        <div className="mb-4">
                          <span className="text-xs font-semibold text-muted-foreground block mb-2">Expertise:</span>
                          <div className="flex flex-wrap gap-2">
                            {mentor.mentor_expertise.slice(0, 4).map((exp: string, idx: number) => (
                              <Badge key={idx} variant="secondary">{exp}</Badge>
                            ))}
                            {mentor.mentor_expertise.length > 4 && (
                              <Badge variant="outline">+{mentor.mentor_expertise.length - 4}</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mb-4">
                        {mentor.mentor_linkedin && (
                          <a href={mentor.mentor_linkedin} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <Linkedin className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {mentor.linkedin_url && !mentor.mentor_linkedin && (
                          <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <Linkedin className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>

                      {connectionStatuses[mentor.user_id] === "accepted" ? (
                        <Button 
                          disabled
                          variant="outline"
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Connected
                        </Button>
                      ) : connectionStatuses[mentor.user_id] === "pending" ? (
                        <Button 
                          disabled
                          variant="outline"
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Pending
                        </Button>
                      ) : (
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnect(mentor.user_id);
                          }}
                          className="w-full bg-gradient-to-r from-primary to-accent text-white"
                        >
                          <GraduationCap className="w-4 h-4 mr-2" />
                          Request Mentorship
                        </Button>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          currentUserId={currentUserId}
          connectionStatus={connectionStatuses[selectedProfile.user_id]}
          onConnect={handleConnect}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}

      <Footer />
    </div>
  );
};

export default FindTeammates;