import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { mapProfileToUserData, type UserData } from "@/lib/user";
import {
  ensureProfileFromAuth,
  getProfile,
  isProfileComplete,
  isProfileCompleteFromAuth,
  saveProfileAvatar,
  saveProfileLocation,
  uploadProfileAvatar,
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

  const updateAvatar = useCallback(
    async (file: File) => {
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

      const { url, error: uploadError } = await uploadProfileAvatar(file, sessionUser.id);
      if (uploadError || !url) {
        throw new Error(uploadError?.message || "Não foi possível enviar a imagem.");
      }

      const { data, error } = await saveProfileAvatar(sessionUser, url);
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
    setUser(null);
    setAuthUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    const applySession = (session: Session | null) => {
      if (session?.user) {
        // Make auth feel instant after OAuth redirect while profile data syncs in background.
        setAuthUser(session.user);
        setUser(mapProfileToUserData(session.user, null));
        void syncUserFromAuth(session.user);
        return;
      }

      clearUser();
    };

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          applySession(session);
          setAuthReady(true);
          return;
        }

        // Fallback for OAuth redirects where session persistence can settle moments later.
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          setAuthUser(currentUser);
          setUser(mapProfileToUserData(currentUser, null));
          void syncUserFromAuth(currentUser);
        } else {
          applySession(null);
        }

        setAuthReady(true);
      } catch (err) {
        console.error("[useProfile] init:", err);
        setAuthReady(true);
      } finally {
        // no-op
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
    updateAvatar,
    clearUser,
  };
}
