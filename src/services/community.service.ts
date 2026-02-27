import { supabase } from '../lib/supabaseClient';

class CommunityService {

  async createPost(userId: string, content: string) {
    const { data, error } = await supabase.from("posts").insert({
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
    });

    return { data, error };
  }

  async likePost(postId: string, userId: string) {
    const { data, error } = await supabase.from("likes").insert({
      post_id: postId,
      user_id: userId,
    });

    return { data, error };
  }

  async commentOnPost(postId: string, userId: string, comment: string) {
    const { data, error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: userId,
      comment,
      created_at: new Date().toISOString(),
    });

    return { data, error };
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      return { data: null, error: "You cannot follow yourself" };
    }

    const { data, error } = await supabase.from("follows").insert({
      follower_id: followerId,
      following_id: followingId,
    });

    return { data, error };
  }

  async getFeed() {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles!posts_user_id_fkey(full_name),
        comments(*),
        likes(*)
      `)
      .order("created_at", { ascending: false });

    return { data, error };
  }

  async getPostComments(postId: string) {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId);

    return { data, error };
  }

  async getFollowers(userId: string) {
    const { data, error } = await supabase
      .from("follows")
      .select("*")
      .eq("following_id", userId);

    return { data, error };
  }

  async getFollowing(userId: string) {
    const { data, error } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", userId);

    return { data, error };
  }
}

export const communityService = new CommunityService();