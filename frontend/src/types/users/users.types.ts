interface UserProfileFields {
  id: string;
  name: string;
  email: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  avatarUrl: string | null;
}

export type PublicUserProfile = UserProfileFields;

export interface AuthenticatedUserProfile extends UserProfileFields {
  phone: string | null;
}

/** @deprecated Use PublicUserProfile or AuthenticatedUserProfile explicitly. */
export type UserProfile = PublicUserProfile;
