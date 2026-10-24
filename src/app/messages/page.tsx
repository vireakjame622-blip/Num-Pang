"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Search,
  User as UserIcon,
  CheckCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Profile, ChatMessage } from "@/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const withUsername = searchParams.get("with");

  const { t } = useLanguage();
  const { user, profile } = useAuth();

  // State
  const [conversations, setConversations] = useState<{
    friend: Profile;
    lastMessage: ChatMessage;
    unreadCount: number;
  }[]>([]);
  const [activeFriend, setActiveFriend] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [searchFriendQuery, setSearchFriendQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper: get local stored messages
  const getStoredMessages = (): ChatMessage[] => {
    try {
      return JSON.parse(localStorage.getItem("numpang_messages") || "[]");
    } catch {
      return [];
    }
  };

  const saveStoredMessages = (msgs: ChatMessage[]) => {
    try {
      localStorage.setItem("numpang_messages", JSON.stringify(msgs));
    } catch {}
  };

  // 1. Fetch all profiles for discovery/chat starting
  useEffect(() => {
    const fetchProfiles = async () => {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .limit(50);
          if (data) {
            setAllUsers(data as Profile[]);
          }
        } catch {}
      }
    };
    fetchProfiles();
  }, []);

  // 2. Fetch conversations list
  useEffect(() => {
    if (!profile) return;

    const loadConversations = async () => {
      setLoading(true);
      const localMsgs = getStoredMessages();
      let dbMsgs: ChatMessage[] = [];

      if (isSupabaseConfigured() && user) {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("messages")
            .select("*, sender:profiles!messages_sender_id_fkey(*), receiver:profiles!messages_receiver_id_fkey(*)")
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order("created_at", { ascending: false });

          if (data) {
            dbMsgs = data as ChatMessage[];
          }
        } catch {
          // fallback to local messages
        }
      }

      // Merge messages
      const allMsgs = [...dbMsgs, ...localMsgs];
      // Deduplicate by id
      const uniqueMap = new Map<string, ChatMessage>();
      allMsgs.forEach((m) => uniqueMap.set(m.id, m));
      const sorted = Array.from(uniqueMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Group by friend
      const convosMap = new Map<
        string,
        { friend: Profile; lastMessage: ChatMessage; unreadCount: number }
      >();

      sorted.forEach((m) => {
        const isMeSender = m.sender_id === profile.id;
        const friendId = isMeSender ? m.receiver_id : m.sender_id;
        const friendProfile = isMeSender
          ? m.receiver || allUsers.find((u) => u.id === friendId)
          : m.sender || allUsers.find((u) => u.id === friendId);

        if (friendId && friendId !== profile.id && !convosMap.has(friendId)) {
          convosMap.set(friendId, {
            friend:
              friendProfile || {
                id: friendId,
                username: `user_${friendId.slice(0, 6)}`,
                full_name: "Friend",
                avatar_url: "",
                bio: "",
              },
            lastMessage: m,
            unreadCount: !isMeSender && !m.read ? 1 : 0,
          });
        }
      });

      setConversations(Array.from(convosMap.values()));
      setLoading(false);
    };

    loadConversations();
  }, [profile, user, allUsers]);

  // 3. Load active friend chat when `with` param changes
  useEffect(() => {
    if (!withUsername || !profile) {
      setActiveFriend(null);
      return;
    }

    const loadFriendAndMessages = async () => {
      setLoading(true);
      let targetFriend: Profile | null =
        allUsers.find((u) => u.username.toLowerCase() === withUsername.toLowerCase()) || null;

      if (!targetFriend && isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", withUsername)
            .single();
          if (data) targetFriend = data as Profile;
        } catch {}
      }

      if (targetFriend) {
        setActiveFriend(targetFriend);

        // Fetch thread messages
        const local = getStoredMessages().filter(
          (m) =>
            (m.sender_id === profile.id && m.receiver_id === targetFriend!.id) ||
            (m.sender_id === targetFriend!.id && m.receiver_id === profile.id)
        );

        let dbThread: ChatMessage[] = [];
        if (isSupabaseConfigured() && user) {
          try {
            const supabase = createClient();
            const { data } = await supabase
              .from("messages")
              .select("*")
              .or(
                `and(sender_id.eq.${user.id},receiver_id.eq.${targetFriend.id}),and(sender_id.eq.${targetFriend.id},receiver_id.eq.${user.id})`
              )
              .order("created_at", { ascending: true });
            if (data) dbThread = data as ChatMessage[];
          } catch {}
        }

        const map = new Map<string, ChatMessage>();
        [...dbThread, ...local].forEach((m) => map.set(m.id, m));
        const finalThread = Array.from(map.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        setMessages(finalThread);
      }
      setLoading(false);
    };

    loadFriendAndMessages();
  }, [withUsername, profile, user, allUsers]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !profile || !activeFriend || sending) return;

    const content = inputText.trim();
    setInputText("");
    setSending(true);

    const newMsg: ChatMessage = {
      id: `local-msg-${Date.now()}`,
      sender_id: profile.id,
      receiver_id: activeFriend.id,
      content,
      created_at: new Date().toISOString(),
      read: false,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMsg]);

    // Save to local storage
    const allStored = getStoredMessages();
    saveStoredMessages([...allStored, newMsg]);

    // Save to Supabase if configured
    if (isSupabaseConfigured() && user) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("messages")
          .insert({
            sender_id: user.id,
            receiver_id: activeFriend.id,
            content,
          })
          .select()
          .single();

        if (!error && data) {
          // Replace temporary id
          setMessages((prev) =>
            prev.map((m) => (m.id === newMsg.id ? (data as ChatMessage) : m))
          );
        }
      } catch (err) {
        console.warn("Could not save message to Supabase:", err);
      }
    }

    setSending(false);
  };

  // If user is not logged in
  if (!user && !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center mx-auto">
          <MessageCircle className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
          {t.messages}
        </h2>
        <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
          Please log in to chat with friends, exchange food recommendations, and connect with fellow foodies.
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-2.5 rounded-2xl bg-[#C85A32] text-white text-xs font-bold hover:bg-[#B34925] transition-colors shadow-sm"
        >
          {t.signIn} / {t.continueWithGoogle}
        </Link>
      </div>
    );
  }

  // VIEW 1: ACTIVE CHAT ROOM (1-on-1)
  if (activeFriend) {
    return (
      <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-8.5rem)] bg-white dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38] rounded-3xl overflow-hidden shadow-xs">
        {/* Chat Header */}
        <div className="p-3.5 bg-white dark:bg-[#1B1C22] border-b border-[#EFE6D8] dark:border-[#2C2E38] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/messages")}
              className="p-1.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link
              href={`/profile/${activeFriend.username}`}
              className="flex items-center gap-2.5 hover:opacity-85"
            >
              <div className="w-9 h-9 rounded-full bg-[#C85A32]/15 text-[#C85A32] flex items-center justify-center font-bold text-sm overflow-hidden border border-[#C85A32]/30">
                {activeFriend.avatar_url ? (
                  <img
                    src={activeFriend.avatar_url}
                    alt={activeFriend.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  activeFriend.username[0].toUpperCase()
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                  {activeFriend.full_name || activeFriend.username}
                </p>
                <p className="text-[10px] text-[#C85A32] font-semibold">
                  @{activeFriend.username}
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF7F2]/40 dark:bg-[#16171B]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-neutral-400">
              <MessageCircle className="w-10 h-10 stroke-1" />
              <p className="text-xs font-semibold">{t.noMessagesYet}</p>
              <p className="text-[11px] max-w-xs text-neutral-500">
                Ask about the best street food stalls, noodle shops, or hidden spots!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === profile?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                      isMe
                        ? "bg-[#C85A32] text-white rounded-br-xs"
                        : "bg-white dark:bg-[#20222B] text-neutral-900 dark:text-neutral-100 border border-[#EFE6D8] dark:border-[#2C2E38] rounded-bl-xs"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-neutral-400 mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form
          onSubmit={handleSendMessage}
          className="p-2.5 bg-white dark:bg-[#1B1C22] border-t border-[#EFE6D8] dark:border-[#2C2E38] flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.typeMessage}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#C85A32]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-2.5 rounded-2xl bg-[#C85A32] text-white disabled:opacity-40 hover:bg-[#B34925] transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // VIEW 2: CONVERSATIONS LIST
  const filteredUsers = allUsers.filter(
    (u) =>
      u.id !== profile?.id &&
      (u.username.toLowerCase().includes(searchFriendQuery.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchFriendQuery.toLowerCase())))
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
          {t.messages}
        </h1>
        <span className="text-[11px] font-semibold text-[#C85A32]">
          {profile ? `@${profile.username}` : ""}
        </span>
      </div>

      {/* Start New Chat Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
        <input
          type="text"
          value={searchFriendQuery}
          onChange={(e) => setSearchFriendQuery(e.target.value)}
          placeholder="Search friends to chat (ស្វែងរកមិត្តភក្តិ)..."
          className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#C85A32]"
        />
      </div>

      {/* User Search Results if searching */}
      {searchFriendQuery.trim() && (
        <div className="bg-white dark:bg-[#1B1C22] rounded-3xl border border-[#EFE6D8] dark:border-[#2C2E38] p-3 space-y-2 shadow-xs">
          <p className="text-[11px] font-bold text-neutral-500 uppercase px-1">
            Found Friends
          </p>
          {filteredUsers.length === 0 ? (
            <p className="text-xs text-neutral-400 p-2 text-center">
              No foodies found matching &quot;{searchFriendQuery}&quot;
            </p>
          ) : (
            filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => router.push(`/messages?with=${u.username}`)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center font-bold text-xs">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      u.username[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {u.full_name || u.username}
                    </p>
                    <p className="text-[10px] text-neutral-400">@{u.username}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#C85A32] px-2.5 py-1 rounded-lg bg-[#C85A32]/10">
                  Chat
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Conversations List */}
      <div className="bg-white dark:bg-[#1B1C22] rounded-3xl border border-[#EFE6D8] dark:border-[#2C2E38] overflow-hidden shadow-xs">
        {conversations.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <MessageCircle className="w-10 h-10 text-neutral-400 mx-auto stroke-1" />
            <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              {t.noMessagesYet}
            </p>
            <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
              Search a friend above or visit their profile and tap &quot;Message&quot; to start chatting.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EFE6D8] dark:divide-[#2C2E38]">
            {conversations.map(({ friend, lastMessage }) => (
              <button
                key={friend.id}
                onClick={() => router.push(`/messages?with=${friend.username}`)}
                className="w-full p-3.5 flex items-center gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-left transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-[#C85A32]/15 text-[#C85A32] flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0 border border-[#C85A32]/30">
                  {friend.avatar_url ? (
                    <img
                      src={friend.avatar_url}
                      alt={friend.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    friend.username[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {friend.full_name || friend.username}
                    </p>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(lastMessage.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#C85A32] font-semibold">
                    @{friend.username}
                  </p>
                  <p className="text-xs text-neutral-500 truncate mt-0.5">
                    {lastMessage.content}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-neutral-400">
          Loading messages...
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
