import { Post, Profile } from "@/types";

// Empty collections - no fake mock users or placeholder photos
export const DEMO_PROFILES: Record<string, Profile> = {};

export const DEMO_USER: Profile = {
  id: "guest-user",
  username: "khmer_foodie",
  full_name: "Khmer Foodie",
  avatar_url: "",
  bio: "Khmer food lover",
  followers_count: 0,
  following_count: 0,
  posts_count: 0,
};

export const INITIAL_POSTS: Post[] = [];
