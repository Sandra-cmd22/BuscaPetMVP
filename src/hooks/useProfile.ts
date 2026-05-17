import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { mapProfileToUserData, type UserData } from "@/lib/user";
import {
  ensureProfileFromAuth,
  getProfile,
  isProfileComplete,
  isProfileCompleteFromAuth,
  saveProfileLocation,
} from "@/services/profileService";
import type { Profile, ProfileLocationInput } from "@/types/profile";

export function useProfile() {
  const [user, setUser] = useState<UserData | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const profileComplete =
    isProfileComplete(profile) || isProfileCompleteFromAuth(authUser);

  const syncUserFromAuth = useCallback(async (sessionUser: User) => {
    setProfileLoading(true);
    setAuthUser(sessionUser);
    // Fill user immediately so protected navigation does not fall back while profile sync runs.
    setUser(mapProfileToUserData(sessionUser, null));

    try {
      let existing: Profile | null = null;

      const { data, error } = await getProfile(sessionUser.id);
      if (error) {
        console.warn("[useProfile] Falha ao buscar perfil:", error.message);
      } else {
        existing = data;
      }

      if (!existing) {
        const { data: created, error: createError } =
          await ensureProfileFromAuth(sessionUser);
        if (createError) {
          console.warn(
            "[useProfile] Falha ao criar perfil:",
            createError.message,
          );
        } else {
          existing = created;
          const fetched = await getProfile(sessionUser.id);
          if (!fetched.error) {
            existing = fetched.data ?? existing;
          }
        }
      }

      setProfile(existing);
      setUser(mapProfileToUserData(sessionUser, existing));
      return existing;
    } catch (err) {
      console.error("[useProfile] Erro inesperado:", err);
      setProfile(null);
      setUser(mapProfileToUserData(sessionUser, null));
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const completeProfile = useCallback(
    async (fields: ProfileLocationInput) => {
      let sessionUser = authUser;

      if (!sessionUser) {
        const {
          data: { user: fetchedUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw new Error(userError.message);
        }

        if (!fetchedUser) {
          throw new Error("Usuário não autenticado.");
        }

        sessionUser = fetchedUser;
        setAuthUser(fetchedUser);
      }

      const { data, error } = await saveProfileLocation(sessionUser, fields);
      if (error) {
        throw new Error(error.message);
      }
      setProfile(data);
      setUser(mapProfileToUserData(sessionUser, data));
      return data;
    },
    [authUser],
  );

  const clearUser = useCallback(() => {
    console.log("[auth-debug] clearUser() -> resetting user/auth/profile to null");
    setUser(null);
    setAuthUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    const getTokenStorageDebug = () => {
      try {
        const exactKey = "sb-rgubdienrqqdrsvwwuum-auth-token";
        const exactValue = localStorage.getItem(exactKey);
        const allKeys = Object.keys(localStorage).filter((key) =>
          key.includes("-auth-token"),
        );
        return {
          exactKey,
          exactExists: Boolean(exactValue),
          authTokenKeys: allKeys,
        };
      } catch {
        return {
          exactKey: "sb-rgubdienrqqdrsvwwuum-auth-token",
          exactExists: false,
          authTokenKeys: [] as string[],
        };
      }
    };

    const applySession = async (session: Session | null) => {
      console.log("[auth-debug] applySession()", {
        hasSession: Boolean(session),
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
        storage: getTokenStorageDebug(),
      });
      try {
        if (session?.user) {
          await syncUserFromAuth(session.user);
        } else {
          clearUser();
        }
      } catch (err) {
        console.error("[useProfile] applySession:", err);
        if (session?.user) {
          setAuthUser(session.user);
          setUser(mapProfileToUserData(session.user, null));
        } else {
          clearUser();
        }
      }
    };

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log("[auth-debug] init:getSession()", {
          hasSession: Boolean(session),
          userId: session?.user?.id ?? null,
          email: session?.user?.email ?? null,
          storage: getTokenStorageDebug(),
        });

        if (session?.user) {
          await applySession(session);
        } else {
          // Fallback for OAuth redirects where session persistence can settle moments later.
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser();
          console.log("[auth-debug] init:getUser() fallback", {
            hasUser: Boolean(currentUser),
            userId: currentUser?.id ?? null,
            email: currentUser?.email ?? null,
            storage: getTokenStorageDebug(),
          });
          if (currentUser) {
            await syncUserFromAuth(currentUser);
          } else {
            await applySession(null);
          }
        }
      } catch (err) {
        console.error("[useProfile] init:", err);
      } finally {
        setAuthReady(true);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[auth-debug] onAuthStateChange", {
        event,
        hasSession: Boolean(session),
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
        storage: getTokenStorageDebug(),
      });
      void applySession(session);
    });

    return () => subscription.unsubscribe();
  }, [syncUserFromAuth, clearUser]);

  return {
    user,
    authUser,
    profile,
    authReady,
    profileLoading,
    profileComplete,
    syncUserFromAuth,
    completeProfile,
    clearUser,
  };
}
