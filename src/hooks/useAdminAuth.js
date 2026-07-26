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

function normalizeUserId(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

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
  const lastProfileUserIdRef = useRef("");
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

  const resetProfileState = useCallback(
    ({ preserveProfile = false } = {}) => {
      safeSetState(() => {
        if (!preserveProfile) {
          setAdminProfile(null);
        }

        setProfileLoading(false);
        setProfileError("");
        setProfileRetryCount(0);
      });
    },
    [safeSetState]
  );

  const loadAdminProfile = useCallback(
    async (userId, options = {}) => {
      const normalizedUserId = normalizeUserId(userId);
      if (!normalizedUserId) return null;

      const { force = false } = options;

      if (!force) {
        const existing = inFlightProfileRef.current.get(normalizedUserId);
        if (existing) return existing;
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

          // Never destroy a working Admin OS while a live profile refresh runs.
          // Keep the current/cached profile mounted until a definitive result arrives.
          if (cachedProfile) {
            setAdminProfile((current) => current || cachedProfile);
          }
        });

        let lastError = null;

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

            lastError = new Error("Admin profile row was not returned.");
          } catch (error) {
            lastError = error;
            console.error("Admin profile timeout/error:", error);
          }

          if (
            !mountedRef.current ||
            profileFetchIdRef.current !== fetchId ||
            lastProfileUserIdRef.current !== normalizedUserId
          ) {
            return null;
          }

          if (attempt < PROFILE_RETRY_LIMIT) {
            await wait(PROFILE_RETRY_DELAY_MS * attempt);
          }
        }

        if (
          !mountedRef.current ||
          profileFetchIdRef.current !== fetchId ||
          lastProfileUserIdRef.current !== normalizedUserId
        ) {
          return null;
        }

        if (cachedProfile) {
          safeSetState(() => {
            setAdminProfile(cachedProfile);
            setProfileLoading(false);
            setProfileError(
              "Using cached admin profile because the live profile check is temporarily unavailable."
            );
            setProfileRetryCount(0);
          });

          return cachedProfile;
        }

        safeSetState(() => {
          setAdminProfile(null);
          setProfileLoading(false);
          setProfileError(
            lastError?.message ||
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
      const normalizedUserId = normalizeUserId(userId);
      if (!normalizedUserId) return;

      cancelScheduledProfileLoad();

      scheduledProfileTimerRef.current = window.setTimeout(() => {
        scheduledProfileTimerRef.current = null;

        if (!mountedRef.current) return;
        void loadAdminProfile(normalizedUserId, options);
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
          const userId = normalizeUserId(sessionUser.id);

          safeSetState(() => {
            setIsLoggedIn(true);
            setAdminUser(sessionUser);
          });

          await loadAdminProfile(userId);
        } else {
          cancelScheduledProfileLoad();
          lastProfileUserIdRef.current = "";
          invalidateProfileLoads();

          safeSetState(() => {
            setIsLoggedIn(false);
            setAdminUser(null);
          });

          resetProfileState();
        }
      } catch (error) {
        console.error("Session check failed:", error);

        cancelScheduledProfileLoad();
        lastProfileUserIdRef.current = "";
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Keep this callback synchronous. Supabase warns against awaiting another
      // auth/database request directly inside onAuthStateChange.
      const sessionUser = session?.user || null;

      safeSetState(() => {
        setIsLoggedIn(Boolean(sessionUser));
        setAdminUser(sessionUser);
        setSessionChecked(true);
      });

      if (sessionUser) {
        const userId = normalizeUserId(sessionUser.id);

        // getSession() already handles the initial profile load.
        // TOKEN_REFRESHED / repeated SIGNED_IN for the same user must not
        // restart the Admin profile gate or make the UI disappear.
        if (
          lastProfileUserIdRef.current !== userId &&
          !inFlightProfileRef.current.has(userId)
        ) {
          scheduleAdminProfileLoad(userId);
        } else if (
          event === "TOKEN_REFRESHED" ||
          event === "INITIAL_SESSION"
        ) {
          safeSetState(() => {
            setProfileLoading(false);
          });
        }

        return;
      }

      cancelScheduledProfileLoad();
      lastProfileUserIdRef.current = "";
      invalidateProfileLoads();

      safeSetState(() => {
        setAdminProfile(null);
        setProfileLoading(false);
        setProfileError("");
        setProfileRetryCount(0);
      });
    });

    return () => {
      mountedRef.current = false;
      cancelScheduledProfileLoad();
      lastProfileUserIdRef.current = "";
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

      const normalizedEmail = email.trim();

      if (!normalizedEmail || !password) {
        alert("Enter your admin email and password.");
        return;
      }

      try {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: normalizedEmail,
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
            setSessionChecked(true);
          });

          // The SIGNED_IN listener schedules the profile load.
          // Do not perform the same Supabase profile request twice.
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
    lastProfileUserIdRef.current = "";
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
      setAdminProfile(null);
      setProfileLoading(false);
      setProfileError("");
      setProfileRetryCount(0);
    });

    if (typeof onLogoutCleanupRef.current === "function") {
      try {
        onLogoutCleanupRef.current();
      } catch (error) {
        console.error("Logout cleanup failed:", error);
      }
    }
  }, [cancelScheduledProfileLoad, invalidateProfileLoads, safeSetState]);

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
