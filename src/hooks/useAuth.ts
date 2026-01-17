import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "user";

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    isLoading: true,
    isAdmin: false,
  });

  const fetchUserRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching role:", error);
      return "user" as AppRole;
    }
    
    return (data?.role as AppRole) || "user";
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isLoading: false,
        }));

        // Defer role fetching
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id).then(role => {
              setAuthState(prev => ({
                ...prev,
                role,
                isAdmin: role === "admin",
              }));
            });
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            role: null,
            isAdmin: false,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isLoading: false,
      }));
      
      if (session?.user) {
        fetchUserRole(session.user.id).then(role => {
          setAuthState(prev => ({
            ...prev,
            role,
            isAdmin: role === "admin",
          }));
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
  };
}
