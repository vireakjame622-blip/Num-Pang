"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  Grid,
  Bookmark,
  LogOut,
  UserCheck,
  UserPlus,
  ShieldAlert,
  Edit3,
  X,
  Check,
  MapPin,
  UtensilsCrossed,
  MessageCircle,
  Users,
  Loader2,
} from "lucide-react";
import { Post, Profile } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { DEMO_PROFILES, INITIAL_POSTS, DEMO_USER } from "@/lib/demo-data";
import { ModerationModal } from "@/components/common/ModerationModal";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";


function UserProfileContent() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;

  const { t, language } = useLanguage();
  const { profile: currentAuthProfile, signOut, updateProfile } = useAuth();

  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Moderation Modal
  const [modModal, setModModal] = useState<{
    isOpen: boolean;
    type: "report" | "block";
  }>({ isOpen: false, type: "report" });

  // Followers / Following Modal
  const [followModal, setFollowModal] = useState<{
    isOpen: boolean;
    type: "followers" | "following";
    title: string;
    users: Profile[];
    loading: boolean;
  }>({
    isOpen: false,
    type: "followers",
    title: "",
    users: [],
    loading: false,
  });


  const isOwner =
    currentAuthProfile?.username === username ||
    (!currentAuthProfile && username === DEMO_USER.username);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);

      let foundProfile: Profile | null = null;
      let targetUserId = "";

      // 1. Check if it's current user
      if (currentAuthProfile && currentAuthProfile.username === username) {
        foundProfile = currentAuthProfile;
        targetUserId = currentAuthProfile.id;
      }

      // Check Supabase if not found yet
      if (!foundProfile && isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", username)
            .single();

          if (data) {
            foundProfile = data as Profile;
            targetUserId = data.id;
          }
        } catch {
          // fallback
        }
      }

      if (foundProfile) {
        setProfileData(foundProfile);
        setEditName(foundProfile.full_name || "");
        setEditBio(foundProfile.bio || "");
        setEditAvatar(foundProfile.avatar_url || "");
        
        setFollowersCount(foundProfile.followers_count ?? 0);
        setFollowingCount(foundProfile.following_count ?? 0);
        setIsFollowing(!!foundProfile.is_following);

        // Fetch real follower & following counts from Supabase
        if (isSupabaseConfigured() && targetUserId) {
          try {
            const supabase = createClient();
            const { count: fCount } = await supabase
              .from("follows")
              .select("*", { count: "exact", head: true })
              .eq("following_id", targetUserId);
            if (typeof fCount === "number") setFollowersCount(fCount);

            const { count: ingCount } = await supabase
              .from("follows")
              .select("*", { count: "exact", head: true })
              .eq("follower_id", targetUserId);
            if (typeof ingCount === "number") setFollowingCount(ingCount);

            if (currentAuthProfile && currentAuthProfile.id !== targetUserId) {
              const { data: fRec } = await supabase
                .from("follows")
                .select("id")
                .eq("follower_id", currentAuthProfile.id)
                .eq("following_id", targetUserId)
                .maybeSingle();
              setIsFollowing(!!fRec);
            }
          } catch {
            // fallback
          }
        }

        // Fetch User's Posts from Supabase
        let userDbPosts: Post[] = [];
        if (isSupabaseConfigured() && targetUserId) {
          try {
            const supabase = createClient();
            const { data: dbPosts } = await supabase
              .from("posts")
              .select("*, profiles(*)")
              .eq("user_id", targetUserId)
              .order("created_at", { ascending: false });
            if (dbPosts) userDbPosts = dbPosts as Post[];
          } catch {}
        }

        const localPosts: Post[] = JSON.parse(
          localStorage.getItem("numpang_local_posts") || "[]"
        );
        const matchingLocal = localPosts.filter(
          (p) => p.user_id === targetUserId || p.profiles?.username === foundProfile?.username
        );
        const combinedUserPosts = [...userDbPosts, ...matchingLocal];
        setUserPosts(combinedUserPosts);

        // Fetch Saved Posts if owner
        if (isOwner) {
          const localSaved: string[] = JSON.parse(
            localStorage.getItem("numpang_saved") || "[]"
          );
          const savedList = combinedUserPosts.filter(
            (p) => localSaved.includes(p.id) || p.is_saved
          );
          setSavedPosts(savedList);
        }
      }

      setLoading(false);
    };

    if (username) fetchUserData();
  }, [username, currentAuthProfile, isOwner]);

  // Open Followers or Following list modal
  const handleOpenFollowModal = async (type: "followers" | "following") => {
    if (!profileData) return;
    const modalTitle =
      type === "followers"
        ? language === "km"
          ? "អ្នកតាមដាន (Followers)"
          : "Followers"
        : language === "km"
        ? "កំពុងតាមដាន (Following)"
        : "Following";

    setFollowModal({
      isOpen: true,
      type,
      title: modalTitle,
      users: [],
      loading: true,
    });

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const targetField = type === "followers" ? "following_id" : "follower_id";
        const resultField = type === "followers" ? "follower_id" : "following_id";

        const { data: followRows } = await supabase
          .from("follows")
          .select(resultField)
          .eq(targetField, profileData.id);

        if (followRows && followRows.length > 0) {
          const userIds = followRows
            .map((r: any) => r[resultField])
            .filter(Boolean);

          if (userIds.length > 0) {
            const { data: userProfiles } = await supabase
              .from("profiles")
              .select("*")
              .in("id", userIds);

            if (userProfiles) {
              setFollowModal((prev) => ({
                ...prev,
                users: userProfiles as Profile[],
                loading: false,
              }));
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Could not load follow list:", err);
      }
    }
    setFollowModal((prev) => ({ ...prev, loading: false }));
  };

  // Follow / Unfollow
  const handleToggleFollow = async () => {
    const next = !isFollowing;
    setIsFollowing(next);
    setFollowersCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));

    if (isSupabaseConfigured() && currentAuthProfile && profileData) {
      const supabase = createClient();
      if (next) {
        await supabase.from("follows").insert({
          follower_id: currentAuthProfile.id,
          following_id: profileData.id,
        });
      } else {
        await supabase
          .from("follows")
          .delete()
          .match({
            follower_id: currentAuthProfile.id,
            following_id: profileData.id,
          });
      }
    }
  };

  // Save profile edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);

    const updates = {
      full_name: editName.trim(),
      bio: editBio.trim(),
      avatar_url: editAvatar.trim(),
    };

    await updateProfile(updates);
    setProfileData((prev) => (prev ? { ...prev, ...updates } : null));
    setSavingEdit(false);
    setIsEditOpen(false);
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="space-y-2 flex-1">
            <div className="w-36 h-4 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="w-24 h-3 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-3">
        <UtensilsCrossed className="w-12 h-12 text-neutral-400 mx-auto" />
        <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
          User @{username} not found
        </h2>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-xl bg-[#C85A32] text-white text-xs font-bold"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-3 space-y-4">
      {/* 1. Profile Header Card */}
      <div className="bg-white dark:bg-[#1B1C22] rounded-3xl p-5 border border-[#EFE6D8] dark:border-[#2C2E38] shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-[#C85A32] shadow-sm bg-neutral-200 dark:bg-neutral-800">
              {profileData.avatar_url ? (
                <img
                  src={profileData.avatar_url}
                  alt={profileData.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-extrabold text-xl text-[#C85A32]">
                  {profileData.username[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isOwner ? (
              <>
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-[#EFE6D8] dark:border-[#2C2E38] text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:border-[#C85A32] transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t.editProfile}</span>
                </button>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  title={t.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleToggleFollow}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isFollowing
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                      : "bg-[#C85A32] text-white hover:bg-[#B34925]"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{t.unfollow}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{t.follow}</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/messages?with=${profileData.username}`}
                  className="px-3 py-1.5 rounded-xl border border-[#EFE6D8] dark:border-[#2C2E38] text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:border-[#C85A32] transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#C85A32]" />
                  <span>{t.messageFriend}</span>
                </Link>

                <button
                  onClick={() => setModModal({ isOpen: true, type: "report" })}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-[#C85A32]"
                  title="Report user"
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bio & Details */}
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
            {profileData.full_name || profileData.username}
          </h2>
          <p className="text-xs font-semibold text-[#C85A32] dark:text-[#E06D44]">
            @{profileData.username}
          </p>
          {profileData.bio && (
            <p className="text-xs text-neutral-700 dark:text-neutral-300 pt-1 leading-relaxed">
              {profileData.bio}
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-neutral-100 dark:border-neutral-800 text-center">
          <div className="py-1">
            <div className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
              {userPosts.length}
            </div>
            <div className="text-[10px] text-neutral-500">{t.postsCount}</div>
          </div>
          <button
            onClick={() => handleOpenFollowModal("followers")}
            className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 py-1 rounded-xl transition-all cursor-pointer"
            title="View Followers"
          >
            <div className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100 group-hover:text-[#C85A32] transition-colors">
              {followersCount}
            </div>
            <div className="text-[10px] text-neutral-500 font-medium group-hover:text-[#C85A32] transition-colors">
              {t.followers}
            </div>
          </button>
          <button
            onClick={() => handleOpenFollowModal("following")}
            className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 py-1 rounded-xl transition-all cursor-pointer"
            title="View Following"
          >
            <div className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100 group-hover:text-[#C85A32] transition-colors">
              {followingCount}
            </div>
            <div className="text-[10px] text-neutral-500 font-medium group-hover:text-[#C85A32] transition-colors">
              {t.following}
            </div>
          </button>
        </div>
      </div>

      {/* 2. Grid Tabs: Posts vs Saved */}
      <div className="flex border-b border-[#EFE6D8] dark:border-[#2C2E38]">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === "posts"
              ? "border-[#C85A32] text-[#C85A32] dark:text-[#E06D44]"
              : "border-transparent text-neutral-400 hover:text-neutral-700"
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>{t.tabMyPosts} ({userPosts.length})</span>
        </button>

        {isOwner && (
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === "saved"
                ? "border-[#C85A32] text-[#C85A32] dark:text-[#E06D44]"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{t.tabSaved} ({savedPosts.length})</span>
          </button>
        )}
      </div>

      {/* 3. Photos Grid */}
      {activeTab === "posts" ? (
        userPosts.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            No dishes shared yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {userPosts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shadow-xs"
              >
                <img
                  src={post.image_url}
                  alt={post.dish_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 text-white text-[10px] font-bold">
                  <span className="truncate">{post.dish_name}</span>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : savedPosts.length === 0 ? (
        <div className="py-12 text-center text-xs text-neutral-400">
          No saved spots yet.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {savedPosts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shadow-xs"
            >
              <img
                src={post.image_url}
                alt={post.dish_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 text-white text-[10px] font-bold">
                <span className="truncate">{post.dish_name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 4. Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#1B1C22] rounded-3xl p-5 border border-[#EFE6D8] dark:border-[#2C2E38] shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                {t.editProfile}
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 pt-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                  {t.fullName}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                  Avatar Photo URL
                </label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                  {t.bio}
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell foodies about your favorite street spots..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <button
                type="submit"
                disabled={savingEdit}
                className="w-full py-2.5 rounded-xl bg-[#C85A32] text-white text-xs font-bold hover:bg-[#B34925] transition-colors"
              >
                {savingEdit ? "Saving..." : t.saveChanges}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      <ModerationModal
        isOpen={modModal.isOpen}
        onClose={() => setModModal({ ...modModal, isOpen: false })}
        type={modModal.type}
        targetUserId={profileData.id}
        targetUsername={profileData.username}
        onBlockSuccess={() => router.push("/")}
      />

      {/* 5. Followers / Following List Modal */}
      {followModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#EFE6D8] dark:border-[#2C2E38] pb-2.5">
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#C85A32]" />
                <span>{followModal.title}</span>
              </h3>
              <button
                onClick={() => setFollowModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {followModal.loading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#C85A32]" />
              </div>
            ) : followModal.users.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400 space-y-1">
                <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {language === "km" ? "មិនទាន់មាននរណាម្នាក់ទេ" : "No users found"}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {followModal.type === "followers"
                    ? language === "km" ? "គណនីនេះមិនទាន់មានអ្នក Follow នៅឡើយទេ" : "No followers yet"
                    : language === "km" ? "គណនីនេះមិនទាន់បាន Follow នរណាម្នាក់ឡើយ" : "Not following anyone yet"}
                </p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-[#EFE6D8]/50 dark:divide-[#2C2E38]/50 pr-1">
                {followModal.users.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username}`}
                    onClick={() => setFollowModal((prev) => ({ ...prev, isOpen: false }))}
                    className="flex items-center justify-between py-2 px-1 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0 border border-[#C85A32]/20">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                        ) : (
                          u.username[0].toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {u.full_name || u.username}
                        </p>
                        <p className="text-[10px] text-[#C85A32] font-semibold truncate">
                          @{u.username}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#C85A32] px-2.5 py-1 rounded-lg bg-[#C85A32]/10">
                      View
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto p-4 animate-pulse"><div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-800" /></div>}>
      <UserProfileContent />
    </Suspense>
  );
}
