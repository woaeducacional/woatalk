import { supabase } from '../lib/supabaseClient';

class UserService {

  async createUser(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      return { data: null, error };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        email,
        full_name: fullName,
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      return { data: null, error: profileError };
    }

    return { data: data.user, error: null };
  }

  async loginUser(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  }

  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    return { data, error };
  }

  async deleteUser(userId: string) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    return { data: !error, error };
  }

  async listUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*");

    return { data, error };
  }
}

export const userService = new UserService();