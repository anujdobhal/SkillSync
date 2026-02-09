import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Users, GraduationCap } from "lucide-react";
import SkillsInput from "@/components/SkillsInput";
import ProfilePhotoManager from "@/components/ProfilePhotoManager";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [userId, setUserId] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profilePhotoVisible, setProfilePhotoVisible] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    department: "",
    year: "",
    bio: "",
    domain: "",
    github_url: "",
    linkedin_url: "",
    leetcode_url: "",
    codeforces_url: "",
    portfolio_url: "",
    skills: [] as string[],
    interests: [] as string[],
    is_mentor: false,
    mentor_expertise: [] as string[],
    mentor_bio: "",
    mentor_linkedin: "",
    years_experience: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      toast.error("Error loading profile");
      setLoading(false);
      return;
    }

    // Load connections count
    const { count } = await supabase
      .from("connections")
      .select("*", { count: 'exact', head: true })
      .eq("status", "accepted")
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);

    setConnectionsCount(count || 0);

    if (data) {
      setProfilePhoto(data.profile_photo);
      setProfilePhotoVisible(data.profile_photo_visible ?? true);
      setProfile({
        name: data.name || "",
        email: data.email || "",
        department: data.department || "",
        year: data.year?.toString() || "",
        bio: data.bio || "",
        domain: data.domain || "",
        github_url: data.github_url || "",
        linkedin_url: data.linkedin_url || "",
        leetcode_url: data.leetcode_url || "",
        codeforces_url: data.codeforces_url || "",
        portfolio_url: data.portfolio_url || "",
        skills: data.skills || [],
        interests: data.interests || [],
        is_mentor: data.is_mentor || false,
        mentor_expertise: data.mentor_expertise || [],
        mentor_bio: data.mentor_bio || "",
        mentor_linkedin: data.mentor_linkedin || "",
        years_experience: data.years_experience?.toString() || "",
      });
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!profile.name || profile.name.trim() === "") {
      toast.error("Full Name is required");
      setSaving(false);
      return;
    }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      setSaving(false);
      return;
    }

    // Build update object with only basic fields first
    const updateData: any = {
      name: profile.name,
      department: profile.department || null,
      year: profile.year ? parseInt(profile.year) : null,
      bio: profile.bio || null,
      domain: profile.domain || null,
      github_url: profile.github_url || null,
      linkedin_url: profile.linkedin_url || null,
      leetcode_url: profile.leetcode_url || null,
      codeforces_url: profile.codeforces_url || null,
      portfolio_url: profile.portfolio_url || null,
      skills: profile.skills || [],
      interests: profile.interests || [],
    };

    // Add mentor fields only if is_mentor is true
    // These fields might not exist if migration hasn't been run yet
    try {
      if (profile.is_mentor) {
        updateData.is_mentor = true;
        updateData.mentor_expertise = profile.mentor_expertise || [];
        updateData.mentor_bio = profile.mentor_bio || null;
        updateData.mentor_linkedin = profile.mentor_linkedin || null;
        updateData.years_experience = profile.years_experience ? parseInt(profile.years_experience) : null;
      } else {
        updateData.is_mentor = false;
      }
    } catch (e) {
      // If mentor fields don't exist in DB yet, just skip them
      console.log("Mentor fields not available, skipping...");
    }

    const { error, data } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", session.user.id)
      .select();

    if (error) {
      console.error("Profile update error:", error);
      // If error is about mentor fields not existing, try without them
      if (error.message?.includes('mentor') || error.message?.includes('column') || error.code === '42703') {
        // Remove mentor fields and try again
        const { is_mentor, mentor_expertise, mentor_bio, mentor_linkedin, years_experience, ...basicFields } = updateData;
        const { error: retryError } = await supabase
          .from("profiles")
          .update(basicFields)
          .eq("user_id", session.user.id);

        if (retryError) {
          toast.error(`Error saving profile: ${retryError.message}`);
          console.error("Retry error:", retryError);
        } else {
          toast.success("Profile updated! (Mentor fields will be available after migration)");
        }
      } else {
        toast.error(`Error saving profile: ${error.message || 'Unknown error'}`);
      }
      setSaving(false);
      return;
    }

    toast.success("Profile updated successfully!");
    setSaving(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSkillsChange = (skills: string[]) => {
    setProfile(prev => ({ ...prev, skills }));
  };

  const handleInterestsChange = (interests: string[]) => {
    setProfile(prev => ({ ...prev, interests }));
  };

  const handleMentorExpertiseChange = (expertise: string[]) => {
    setProfile(prev => ({ ...prev, mentor_expertise: expertise }));
  };

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
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Edit Profile</h1>
            <p className="text-muted-foreground">Update your information to help teammates find you</p>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {connectionsCount} Connections
              </Badge>
              {profile.is_mentor && (
                <Badge variant="default" className="flex items-center gap-1 bg-gradient-to-r from-primary to-accent">
                  <GraduationCap className="w-3 h-3" />
                  Mentor
                </Badge>
              )}
            </div>
          </div>

          <ProfilePhotoManager
            profilePhoto={profilePhoto}
            profilePhotoVisible={profilePhotoVisible}
            userName={profile.name}
            userId={userId}
            onPhotoUpdate={loadProfile}
          />

          <Card className="glass-card p-8">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={profile.email}
                    disabled
                    className="mt-2 bg-muted"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="department">Department/Branch</Label>
                  <Input
                    id="department"
                    name="department"
                    value={profile.department}
                    onChange={handleChange}
                    placeholder="Computer Science"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    value={profile.year}
                    onChange={handleChange}
                    placeholder="2"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="domain">Domain/Interest Area</Label>
                <Input
                  id="domain"
                  name="domain"
                  value={profile.domain}
                  onChange={handleChange}
                  placeholder="Web Development, AI/ML, etc."
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="skills">Skills</Label>
                <div className="mt-2">
                  <SkillsInput 
                    skills={profile.skills}
                    onChange={handleSkillsChange}
                    placeholder="Add a skill (e.g., React, Python)"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="interests">Interests</Label>
                <div className="mt-2">
                  <SkillsInput 
                    skills={profile.interests}
                    onChange={handleInterestsChange}
                    placeholder="Add an interest (e.g., Web Development)"
                  />
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_mentor" className="text-base font-semibold">Apply as Mentor</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enable this to become a mentor and help students with guidance
                    </p>
                  </div>
                  <Switch
                    id="is_mentor"
                    checked={profile.is_mentor}
                    onCheckedChange={(checked) => setProfile(prev => ({ ...prev, is_mentor: checked }))}
                  />
                </div>

                {profile.is_mentor && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                    <div>
                      <Label htmlFor="mentor_expertise">Mentor Expertise *</Label>
                      <div className="mt-2">
                        <SkillsInput 
                          skills={profile.mentor_expertise}
                          onChange={handleMentorExpertiseChange}
                          placeholder="Add expertise areas (e.g., Web Development, AI/ML)"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="mentor_bio">Mentor Bio</Label>
                      <Textarea
                        id="mentor_bio"
                        name="mentor_bio"
                        value={profile.mentor_bio}
                        onChange={handleChange}
                        placeholder="Tell students about your mentoring experience and approach..."
                        className="mt-2"
                        rows={4}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="mentor_linkedin">Mentor LinkedIn URL</Label>
                        <Input
                          id="mentor_linkedin"
                          name="mentor_linkedin"
                          value={profile.mentor_linkedin}
                          onChange={handleChange}
                          placeholder="https://linkedin.com/in/username"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="years_experience">Years of Experience</Label>
                        <Input
                          id="years_experience"
                          name="years_experience"
                          type="number"
                          value={profile.years_experience}
                          onChange={handleChange}
                          placeholder="5"
                          className="mt-2"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Links</h3>
                
                <div>
                  <Label htmlFor="github_url">GitHub URL</Label>
                  <Input
                    id="github_url"
                    name="github_url"
                    value={profile.github_url}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    name="linkedin_url"
                    value={profile.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="leetcode_url">LeetCode URL</Label>
                  <Input
                    id="leetcode_url"
                    name="leetcode_url"
                    value={profile.leetcode_url}
                    onChange={handleChange}
                    placeholder="https://leetcode.com/username"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="codeforces_url">Codeforces URL</Label>
                  <Input
                    id="codeforces_url"
                    name="codeforces_url"
                    value={profile.codeforces_url}
                    onChange={handleChange}
                    placeholder="https://codeforces.com/profile/username"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="portfolio_url">Portfolio URL</Label>
                  <Input
                    id="portfolio_url"
                    name="portfolio_url"
                    value={profile.portfolio_url}
                    onChange={handleChange}
                    placeholder="https://yourportfolio.com"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-primary to-accent text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  onClick={() => navigate("/dashboard")}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;