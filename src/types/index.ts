export type Category = 'noodles' | 'rice' | 'dessert' | 'drinks' | 'snacks' | 'other';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website?: string | null;
  created_at?: string;
  updated_at?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  dish_name: string;
  category: Category;
  price_usd: number | null;
  price_khr: number | null;
  caption: string | null;
  image_url: string;
  location_name: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at?: string;
  profiles?: Profile;
  user?: Profile;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
  user?: Profile;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Save {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Report {
  id?: string;
  reporter_id: string;
  reported_post_id?: string;
  reported_user_id?: string;
  reason: string;
  details?: string;
  status?: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  created_at?: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read?: boolean;
  sender?: Profile;
  receiver?: Profile;
}

export type Language = 'en' | 'km';
