import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getProfilePhotoUrl } from "@/lib/profile-photo";

interface ProfileAvatarProps {
  profile: {
    profile_photo_url?: string | null;
    profile_photo?: string | null;
    profile_photo_visible?: boolean | null;
    hide_photo?: boolean | null;
    name?: string | null;
    email?: string | null;
    user_id: string;
  };
  currentUserId: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-2xl",
  xl: "w-24 h-24 text-3xl",
};

export function ProfileAvatar({ profile, currentUserId, size = "md", className = "" }: ProfileAvatarProps) {
  const photoUrl = getProfilePhotoUrl(profile, currentUserId, profile.user_id) || profile.profile_photo || null;
  const displayName = profile.name || profile.email || "U";
  const initial = displayName[0]?.toUpperCase() || "U";

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={photoUrl || undefined} alt={displayName} />
      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}

