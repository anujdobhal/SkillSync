import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Briefcase, Users, User, Image as ImageIcon, X, Heart, MessageCircle, Share2, FileText, MoreVertical, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import { ProfileAvatar } from "@/components/ProfileAvatar";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profile?: {
    name: string;
    profile_photo: string | null;
    profile_photo_url?: string | null;
    profile_photo_visible?: boolean | null;
    hide_photo?: boolean | null;
    email?: string | null;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [postLikes, setPostLikes] = useState<Record<string, number>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, Array<{ id: string; text: string; author: string; time: string }>>>({});
  const [showCommentInput, setShowCommentInput] = useState<Record<string, boolean>>({});
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    checkAuth();
    // Initialize posts table on mount (for Lovable automatic setup)
    initializePostsTable();
  }, []);

  const initializePostsTable = async () => {
    try {
      // Try to query posts table to check if it exists
      // @ts-ignore - posts table exists via migration but types may not be updated yet
      const { error } = await supabase.from("posts").select("id").limit(1);
      
      if (error) {
        // Table doesn't exist - log for debugging
        console.error("Posts table not found:", error);
        console.log("Please ensure migration file is applied in Lovable");
      } else {
        console.log("Posts table exists and is accessible");
      }
    } catch (error) {
      console.error("Error checking posts table:", error);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      loadPosts();

      // Subscribe to new posts
      const channel = supabase
        .channel('posts-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'posts' },
          () => {
            loadPosts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setCurrentUserId(session.user.id);

    // Fetch user profile
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

    setProfile(data);

    setLoading(false);
  };

  const loadPosts = async () => {
    try {
      // Fetch posts first
      // @ts-ignore - posts table exists via migration but types may not be updated yet
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error loading posts:", postsError);
        // If table doesn't exist, show helpful message
        if (postsError.message?.includes("does not exist") || postsError.message?.includes("schema cache")) {
          console.error("Posts table not found. Please ensure the migration has been applied.");
          toast.error("Posts table not found. Migration may need to be applied.");
        }
        setPosts([]);
        return;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Use fallback method to properly JOIN with profiles
      return await loadPostsFallback();
    } catch (error) {
      console.error("Error in loadPosts:", error);
      setPosts([]);
    }
  };

  // Fallback method if JOIN doesn't work
  const loadPostsFallback = async () => {
    try {
      // @ts-ignore - posts table exists via migration but types may not be updated yet
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error loading posts (fallback):", postsError);
        setPosts([]);
        return;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Fetch profiles for all unique user_ids with proper JOIN logic
      const userIds = [...new Set(postsData.map((post: any) => post.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name, email, profile_photo_url, profile_photo_visible, hide_photo")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Error loading profiles (fallback):", profilesError);
      }

      // Create a map of user_id to profile for efficient lookup
      const profileMap = new Map();
      (profilesData || []).forEach((profile: any) => {
        profileMap.set(profile.user_id, profile);
      });

      // Log missing profiles for debugging (posts will still be shown with fallback names)
      const missingUserIds = userIds.filter(userId => !profileMap.has(userId));
      if (missingUserIds.length > 0) {
        console.warn(`Missing profiles for ${missingUserIds.length} user(s). Posts will still be shown with fallback names.`);
        console.warn("Profiles should be auto-created on signup via handle_new_user trigger.");
      }

      // Combine posts with profiles - NEVER skip posts, always show them
      const transformedPosts: Post[] = postsData.map((post: any) => {
        try {
          const profileData = profileMap.get(post.user_id);
          
          // Get actual full name from profiles.name with fallbacks
          let displayName = "";
          if (profileData && profileData.name && profileData.name.trim()) {
            // Use actual full name from profile
            displayName = profileData.name.trim();
          } else if (profileData && profileData.email) {
            // Use email username if name is missing
            displayName = profileData.email.split('@')[0];
            console.warn(`Using email username for user ${post.user_id} - name missing`);
          } else {
            // If profile is completely missing, use user ID last 8 chars as fallback
            // This ensures posts are ALWAYS shown, never skipped
            displayName = `User ${post.user_id.slice(-8)}`;
            console.warn(`No profile found for user ${post.user_id} - using fallback name`);
          }
          
          return {
            id: post.id,
            user_id: post.user_id,
            content: post.content || "",
            image_url: post.image_url || null,
            created_at: post.created_at,
            profile: profileData ? {
              name: displayName,
              profile_photo: getProfilePhotoUrl(profileData, currentUserId, post.user_id),
              profile_photo_url: profileData.profile_photo_url,
              profile_photo_visible: profileData.profile_photo_visible,
              hide_photo: profileData.hide_photo,
              email: profileData.email,
            } : {
              name: displayName,
              profile_photo: null,
            },
          };
        } catch (error) {
          console.error("Error processing post:", error);
          // Even on error, return a post with fallback data
          return {
            id: post.id,
            user_id: post.user_id,
            content: post.content || "",
            image_url: post.image_url || null,
            created_at: post.created_at,
            profile: {
              name: `User ${post.user_id.slice(-8)}`,
              profile_photo: null
            },
          };
        }
      });

      // Initialize likes count for posts (default to 0 if not set)
      const likesMap: Record<string, number> = {};
      transformedPosts.forEach(post => {
        if (!postLikes[post.id]) {
          likesMap[post.id] = 0;
        }
      });
      setPostLikes(prev => ({ ...prev, ...likesMap }));

      setPosts(transformedPosts);
    } catch (error) {
      console.error("Error in loadPostsFallback:", error);
      setPosts([]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPostImage(null);
    setPostImagePreview(null);
  };

  const handlePostSubmit = async () => {
    if (!postContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    if (!currentUserId) {
      toast.error("You must be logged in to post");
      return;
    }

    setIsPosting(true);

    try {
      let imageUrl = null;

      // Upload image if selected
      if (postImage) {
        toast.loading("Uploading image...", { id: "upload-post-image" });
        try {
          // Check if bucket exists by trying to list it
          const { error: bucketError } = await supabase.storage
            .from('post_images')
            .list('', { limit: 1 });
          
          if (bucketError && (bucketError.message?.includes('not found') || bucketError.message?.includes('Bucket'))) {
            toast.error("Image storage not configured. Please ensure migration is applied.", { id: "upload-post-image" });
            // Continue without image
          } else {
            const fileExt = postImage.name.split('.').pop();
            const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('post_images')
              .upload(fileName, postImage, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error("Upload error:", uploadError);
              const errorMsg = uploadError.message.includes('Bucket not found') 
                ? "Image storage not configured. Post will be created without image."
                : `Failed to upload image: ${uploadError.message}. Post will be created without image.`;
              toast.error(errorMsg, { id: "upload-post-image" });
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from('post_images')
                .getPublicUrl(fileName);

              imageUrl = publicUrl;
              toast.success("Image uploaded!", { id: "upload-post-image" });
            }
          }
        } catch (error: any) {
          console.error("Error uploading image:", error);
          toast.error(`Upload failed. Try again. ${error.message || ''}`, { id: "upload-post-image" });
        }
      }

      // Create post
      // @ts-ignore - posts table exists via migration but types may not be updated yet
      const { error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: currentUserId,
          content: postContent.trim(),
          image_url: imageUrl,
        });

      if (postError) {
        console.error("Post creation error:", {
          error: postError,
          message: postError.message,
          details: postError.details,
          hint: postError.hint,
          code: postError.code
        });
        const shortMessage = postError.message?.substring(0, 50) || 'Unknown error';
        toast.error(`Failed to create post: ${shortMessage}`);
        setIsPosting(false);
        return;
      }

      toast.success("Post created successfully!");
      setPostContent("");
      setPostImage(null);
      setPostImagePreview(null);
      setIsPostModalOpen(false);
      loadPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("An error occurred");
    } finally {
      setIsPosting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''} ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      const isLiked = newSet.has(postId);
      
      if (isLiked) {
        newSet.delete(postId);
        setPostLikes(prevLikes => ({
          ...prevLikes,
          [postId]: Math.max(0, (prevLikes[postId] || 0) - 1)
        }));
      } else {
        newSet.add(postId);
        setPostLikes(prevLikes => ({
          ...prevLikes,
          [postId]: (prevLikes[postId] || 0) + 1
        }));
      }
      
      return newSet;
    });
  };

  const handleCommentClick = (postId: string) => {
    setShowCommentInput(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleCommentSubmit = (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText || !profile?.name) return;

    const newComment = {
      id: Date.now().toString(),
      text: commentText,
      author: profile.name,
      time: new Date().toISOString()
    };

    setPostComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment]
    }));

    setCommentInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[postId];
      return newInputs;
    });

    setShowCommentInput(prev => ({
      ...prev,
      [postId]: false
    }));
  };

  const handleShare = async (postId: string) => {
    const postUrl = `${window.location.origin}/dashboard#post-${postId}`;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(postUrl);
        toast.success("Link copied to clipboard!");
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = postUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          toast.success("Link copied to clipboard!");
        } catch (err) {
          toast.error("Failed to copy link");
        }
        document.body.removeChild(textArea);
      }
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUserId) return;
    
    setIsDeleting(true);
    try {
      // @ts-ignore - posts table exists via migration but types may not be updated yet
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", currentUserId); // Ensure user can only delete their own posts
      
      if (error) throw error;
      
      toast.success("Post deleted successfully!");
      setDeletePostId(null);
      loadPosts(); // Reload posts after deletion
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error(`Failed to delete post: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPosts = showMyPosts 
    ? posts.filter(post => post.user_id === currentUserId)
    : posts;

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
            <h1 className="text-4xl font-bold mb-2">Welcome back, {profile?.name}!</h1>
            <p className="text-muted-foreground">Here's what's happening with your projects and connections</p>
          </div>

          {/* Create Post Section */}
          <Card className="glass-card p-6 mb-8">
            <div className="flex items-center gap-4">
              <ProfileAvatar 
                profile={profile ? { ...profile, user_id: currentUserId || '' } : { user_id: currentUserId || '', name: profile?.name }}
                currentUserId={currentUserId}
                size="lg"
              />
              <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex-1 justify-start text-left text-muted-foreground hover:text-foreground"
                  >
                    Start a post...
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create a Post</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Textarea
                      placeholder="What's on your mind?"
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="min-h-[150px] resize-none"
                    />
                    {postImagePreview && (
                      <div className="relative">
                        <img 
                          src={postImagePreview} 
                          alt="Preview" 
                          className="w-full rounded-lg max-h-[300px] object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Button 
                        variant="outline" 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPosting}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Add Image
                      </Button>
                      <input
                        ref={fileInputRef}
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                        disabled={isPosting}
                      />
                      <Button 
                        onClick={handlePostSubmit}
                        disabled={isPosting || !postContent.trim()}
                        className="bg-gradient-to-r from-primary to-accent text-white"
                      >
                        {isPosting ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>

          {/* Posts Feed */}
          <div className="space-y-6 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{showMyPosts ? "My Posts" : "Feed"}</h2>
              <div className="flex gap-2">
                <Button
                  variant={showMyPosts ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowMyPosts(!showMyPosts)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {showMyPosts ? "Show All Posts" : "My Posts"}
                </Button>
              </div>
            </div>
            {filteredPosts.length === 0 ? (
              <Card className="glass-card p-8 text-center">
                <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
              </Card>
            ) : (
              filteredPosts.map((post) => {
                const isLiked = likedPosts.has(post.id);
                const likesCount = postLikes[post.id] || 0;
                const comments = postComments[post.id] || [];
                const showComment = showCommentInput[post.id] || false;
                
                return (
                  <Card key={post.id} id={`post-${post.id}`} className="glass-card p-6">
                    <div className="flex items-start gap-4">
                      <ProfileAvatar 
                        profile={post.profile ? { ...post.profile, user_id: post.user_id } : { user_id: post.user_id, name: post.profile?.name }}
                        currentUserId={currentUserId}
                        size="md"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{post.profile?.name || ""}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatTimeAgo(post.created_at)}
                            </span>
                          </div>
                          {/* Delete button - only show for own posts */}
                          {post.user_id === currentUserId && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setDeletePostId(post.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Post
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap mb-3">{post.content}</p>
                        {post.image_url && (
                          <img 
                            src={post.image_url} 
                            alt="Post" 
                            className="w-full rounded-lg max-h-[500px] object-cover mb-3"
                            onError={(e) => {
                              console.error("Failed to load post image:", post.image_url);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        
                        {/* Post Actions */}
                        <div className="flex items-center gap-4 pt-2 border-t mt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 hover:text-primary"
                            onClick={() => handleLike(post.id)}
                          >
                            <Heart 
                              className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                            />
                            <span>{likesCount}</span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 hover:text-primary"
                            onClick={() => handleCommentClick(post.id)}
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>Comment</span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 hover:text-primary"
                            onClick={() => handleShare(post.id)}
                          >
                            <Share2 className="h-4 w-4" />
                            <span>Share</span>
                          </Button>
                        </div>
                        
                        {/* Comment Input */}
                        {showComment && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Write a comment..."
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({
                                  ...prev,
                                  [post.id]: e.target.value
                                }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCommentSubmit(post.id);
                                  }
                                }}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleCommentSubmit(post.id)}
                                disabled={!commentInputs[post.id]?.trim()}
                              >
                                Post
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Comments List */}
                        {comments.length > 0 && (
                          <div className="mt-4 pt-4 border-t space-y-3">
                            {comments.map((comment) => (
                              <div key={comment.id} className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {comment.author.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold">{comment.author}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatTimeAgo(comment.time)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{comment.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
              <div className="space-y-4">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 font-medium">{profile?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-2 font-medium">{profile?.email}</span>
                </div>
                {profile?.department && (
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <span className="ml-2 font-medium">{profile.department}</span>
                  </div>
                )}
                <Button 
                  onClick={() => navigate("/profile")}
                  className="w-full bg-gradient-to-r from-primary to-accent text-white"
                >
                  Edit Profile
                </Button>
              </div>
            </Card>

            <Card className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate("/find-teammates")}
                  className="w-full justify-start" 
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Find Teammates
                </Button>
                <Button 
                  onClick={() => navigate("/projects/new")}
                  className="w-full justify-start" 
                  variant="outline"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Create New Project
                </Button>
                <Button 
                  onClick={() => navigate("/mentors")}
                  className="w-full justify-start" 
                  variant="outline"
                >
                  <User className="w-4 h-4 mr-2" />
                  Browse Mentors
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />

      {/* Delete Post Confirmation Dialog */}
      <AlertDialog open={deletePostId !== null} onOpenChange={(open) => !open && setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePostId && handleDeletePost(deletePostId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;