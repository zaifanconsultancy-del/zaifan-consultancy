import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

import {
  fetchAdminProfileRow,
  getCachedAdminProfile,
  setCachedAdminProfile,
} from "../services/crm/adminProfileService";

import {
  PROFILE_RETRY_DELAY_MS,
  PROFILE_RETRY_LIMIT,
} from "../utils/crm/constants";

import { wait, withTimeout } from "../utils/crm/requestUtils";

export default function useAdminAuth({ onLogoutCleanup } = {}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileRetryCount, setProfileRetryCount] = useState(0);

  const mountedRef = useRef(false);
  const profileFetchIdRef = useRef(0);
  const scheduledProfileTimerRef = useRef(null);
  const lastProfileUserIdRef = useRef(null);
  const inFlightProfileRef = useRef(new Map());
  const onLogoutCleanupRef = useRef(onLogoutCleanup);

  useEffect(() => {
    onLogoutCleanupRef.current = onLogoutCleanup;
  }, [onLogoutCleanup]);

  const safeSetState = useCallback((callback) => {
    if (mountedRef.current) callback();
  }, []);

  const cancelScheduledProfileLoad = useCallback(() => {
    if (scheduledProfileTimerRef.current !== null) {
      window.clearTimeout(scheduledProfileTimerRef.current);
      scheduledProfileTimerRef.current = null;
    }
  }, []);

  const invalidateProfileLoads = useCallback(() => {
    profileFetchIdRef.current += 1;
    inFlightProfileRef.current.clear();
  }, []);

  const resetProfileState = useCallback(() => {
    safeSetState(() => {
      setAdminProfile(null);
      setProfileLoading(false);
      setProfileError("");
      setProfileRetryCount(0);
    });
  }, [safeSetState]);

  const loadAdminProfile = useCallback(
    async (userId, options = {}) => {
      if (!userId) return null;

      const { force = false } = options;
      const normalizedUserId = String(userId);

      if (!force) {
        const existingPromise = inFlightProfileRef.current.get(normalizedUserId);
        if (existingPromise) return existingPromise;
      }

      const requestPromise = (async () => {
        const fetchId = profileFetchIdRef.current + 1;
        profileFetchIdRef.current = fetchId;
        lastProfileUserIdRef.current = normalizedUserId;

        const cachedProfile = getCachedAdminProfile(normalizedUserId);

        safeSetState(() => {
          setProfileLoading(true);
          setProfileError("");
          setProfileRetryCount(0);

          if (force) {
            setAdminProfile(null);
          } else if (cachedProfile) {
            setAdminProfile(cachedProfile);
          }
        });

        for (let attempt = 1; attempt <= PROFILE_RETRY_LIMIT; attempt += 1) {
          if (
            !mountedRef.current ||
            profileFetchIdRef.current !== fetchId ||
            lastProfileUserIdRef.current !== normalizedUserId
          ) {
            return null;
          }

          safeSetState(() => setProfileRetryCount(attempt));

          try {
            const { data, error } = await withTimeout(
              fetchAdminProfileRow(normalizedUserId),
              `Admin profile fetch attempt ${attempt}`
            );

            if (
              !mountedRef.current ||
              profileFetchIdRef.current !== fetchId ||
              lastProfileUserIdRef.current !== normalizedUserId
            ) {
              return null;
            }

            if (error) throw error;

            if (data) {
              setCachedAdminProfile(normalizedUserId, data);

              safeSetState(() => {
                setAdminProfile(data);
                setProfileLoading(false);
                setProfileError("");
                setProfileRetryCount(0);
              });

              return data;
            }

            if (attempt < PROFILE_RETRY_LIMIT) {
              await wait(PROFILE_RETRY_DELAY_MS * attempt);
            }
          } catch (error) {
            console.error("Admin profile timeout/error:", error);

            if (
              !mountedRef.current ||
              profileFetchIdRef.current !== fetchId ||
              lastProfileUserIdRef.current !== normalizedUserId
            ) {
              return null;
            }

            if (attempt < PROFILE_RETRY_LIMIT) {
              await wait(PROFILE_RETRY_DELAY_MS * attempt);
              continue;
            }

            if (cachedProfile) {
              safeSetState(() => {
                setAdminProfile(cachedProfile);
                setProfileLoading(false);
                setProfileError(
                  "Using cached admin profile because the live profile check timed out."
                );
                setProfileRetryCount(0);
              });

              return cachedProfile;
            }
          }
        }

        if (
          !mountedRef.current ||
          profileFetchIdRef.current !== fetchId ||
          lastProfileUserIdRef.current !== normalizedUserId
        ) {
          return null;
        }

        safeSetState(() => {
          setAdminProfile(null);
          setProfileLoading(false);
          setProfileError(
            "Admin profile could not be verified after multiple attempts."
          );
          setProfileRetryCount(0);
        });

        return null;
      })();

      if (!force) {
        inFlightProfileRef.current.set(normalizedUserId, requestPromise);
      }

      try {
        return await requestPromise;
      } finally {
        if (
          inFlightProfileRef.current.get(normalizedUserId) === requestPromise
        ) {
          inFlightProfileRef.current.delete(normalizedUserId);
        }
      }
    },
    [safeSetState]
  );

  const scheduleAdminProfileLoad = useCallback(
    (userId, options = {}) => {
      if (!userId) return;

      cancelScheduledProfileLoad();

      scheduledProfileTimerRef.current = window.setTimeout(() => {
        scheduledProfileTimerRef.current = null;
        if (!mountedRef.current) return;
        void loadAdminProfile(userId, options);
      }, 0);
    },
    [cancelScheduledProfileLoad, loadAdminProfile]
  );

  useEffect(() => {
    mountedRef.current = true;

    const checkSession = async () => {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          "Session check"
        );

        if (error) throw error;
        if (!mountedRef.current) return;

        const sessionUser = data.session?.user || null;

        if (sessionUser) {
          safeSetState(() => {
            setIsLoggedIn(true);
            setAdminUser(sessionUser);
          });

          await loadAdminProfile(sessionUser.id);
        } else {
          lastProfileUserIdRef.current = null;
          invalidateProfileLoads();

          safeSetState(() => {
            setIsLoggedIn(false);
            setAdminUser(null);
          });

          resetProfileState();
        }
      } catch (error) {
        console.error("Session check failed:", error);

        lastProfileUserIdRef.current = null;
        invalidateProfileLoads();

        safeSetState(() => {
          setIsLoggedIn(false);
          setAdminUser(null);
        });

        resetProfileState();
      } finally {
        safeSetState(() => setSessionChecked(true));
      }
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user || null;

      safeSetState(() => {
        setIsLoggedIn(Boolean(sessionUser));
        setAdminUser(sessionUser);
        setSessionChecked(true);
      });

      if (sessionUser) {
        const userId = String(sessionUser.id);

        if (lastProfileUserIdRef.current !== userId) {
          scheduleAdminProfileLoad(userId);
        }
      } else {
        cancelScheduledProfileLoad();
        lastProfileUserIdRef.current = null;
        invalidateProfileLoads();
        resetProfileState();
      }
    });

    return () => {
      mountedRef.current = false;
      cancelScheduledProfileLoad();
      lastProfileUserIdRef.current = null;
      invalidateProfileLoads();
      subscription?.unsubscribe();
    };
  }, [
    cancelScheduledProfileLoad,
    invalidateProfileLoads,
    loadAdminProfile,
    resetProfileState,
    safeSetState,
    scheduleAdminProfileLoad,
  ]);

  const handleLogin = useCallback(
    async (event) => {
      event.preventDefault();

      try {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          }),
          "Login"
        );

        if (error) {
          alert(error.message);
          return;
        }

        if (data.user) {
          safeSetState(() => {
            setAdminUser(data.user);
            setIsLoggedIn(true);
          });
        }

        safeSetState(() => {
          setEmail("");
          setPassword("");
        });
      } catch (error) {
        console.error("Login failed:", error);
        alert("Login request timed out or failed. Check internet and try again.");
      }
    },
    [email, password, safeSetState]
  );

  const logout = useCallback(async () => {
    cancelScheduledProfileLoad();
    lastProfileUserIdRef.current = null;
    invalidateProfileLoads();

    try {
      await withTimeout(supabase.auth.signOut(), "Logout");
    } catch (error) {
      console.error("Logout timeout/error:", error);
    }

    safeSetState(() => {
      setIsLoggedIn(false);
      setSessionChecked(true);
      setAdminUser(null);
      setEmail("");
      setPassword("");
    });

    resetProfileState();

    if (typeof onLogoutCleanupRef.current === "function") {
      try {
        onLogoutCleanupRef.current();
      } catch (error) {
        console.error("Logout cleanup failed:", error);
      }
    }
  }, [
    cancelScheduledProfileLoad,
    invalidateProfileLoads,
    resetProfileState,
    safeSetState,
  ]);

  return {
    isLoggedIn,
    sessionChecked,
    adminUser,
    adminProfile,

    email,
    setEmail,
    password,
    setPassword,

    profileLoading,
    profileError,
    profileRetryCount,

    handleLogin,
    logout,
    loadAdminProfile,
  };
}
