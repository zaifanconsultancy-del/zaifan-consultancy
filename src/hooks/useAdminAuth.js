import { useEffect, useRef, useState } from "react";
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

  const mountedRef = useRef(true);
  const profileFetchIdRef = useRef(0);
  const scheduledProfileTimerRef = useRef(null);
  const lastProfileUserIdRef = useRef(null);

  const safeSetState = (callback) => {
    if (mountedRef.current) callback();
  };

  const cancelScheduledProfileLoad = () => {
    if (scheduledProfileTimerRef.current) {
      window.clearTimeout(scheduledProfileTimerRef.current);
      scheduledProfileTimerRef.current = null;
    }
  };

  const loadAdminProfile = async (userId, options = {}) => {
    if (!userId) return null;

    const { force = false } = options;
    const fetchId = profileFetchIdRef.current + 1;
    profileFetchIdRef.current = fetchId;
    lastProfileUserIdRef.current = userId;

    safeSetState(() => {
      setProfileLoading(true);
      setProfileError("");
      if (force) setAdminProfile(null);
    });

    const cachedProfile = getCachedAdminProfile(userId);

    for (let attempt = 1; attempt <= PROFILE_RETRY_LIMIT; attempt += 1) {
      safeSetState(() => setProfileRetryCount(attempt));

      try {
        const { data, error } = await withTimeout(
          fetchAdminProfileRow(userId),
          `Admin profile fetch attempt ${attempt}`
        );

        if (profileFetchIdRef.current !== fetchId) return null;
        if (error) throw error;

        if (data) {
          setCachedAdminProfile(userId, data);

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

        if (profileFetchIdRef.current !== fetchId) return null;

        if (attempt < PROFILE_RETRY_LIMIT) {
          await wait(PROFILE_RETRY_DELAY_MS * attempt);
          continue;
        }

        if (cachedProfile?.id === userId) {
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

    if (profileFetchIdRef.current !== fetchId) return null;

    safeSetState(() => {
      setAdminProfile(null);
      setProfileLoading(false);
      setProfileError(
        "Admin profile could not be verified after multiple attempts."
      );
      setProfileRetryCount(0);
    });

    return null;
  };

  const scheduleAdminProfileLoad = (userId, options = {}) => {
    if (!userId) return;

    cancelScheduledProfileLoad();

    scheduledProfileTimerRef.current = window.setTimeout(() => {
      scheduledProfileTimerRef.current = null;
      if (!mountedRef.current) return;
      void loadAdminProfile(userId, options);
    }, 0);
  };

  useEffect(() => {
    mountedRef.current = true;

    const checkSession = async () => {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          "Session check"
        );

        if (error) throw error;

        if (data.session?.user) {
          safeSetState(() => {
            setIsLoggedIn(true);
            setAdminUser(data.session.user);
          });

          await loadAdminProfile(data.session.user.id);
        } else {
          safeSetState(() => {
            setIsLoggedIn(false);
            setAdminUser(null);
            setAdminProfile(null);
            setProfileLoading(false);
            setProfileError("");
            setProfileRetryCount(0);
          });
        }
      } catch (error) {
        console.error("Session check failed:", error);

        safeSetState(() => {
          setIsLoggedIn(false);
          setAdminUser(null);
          setAdminProfile(null);
          setProfileLoading(false);
          setProfileError("");
          setProfileRetryCount(0);
        });
      } finally {
        safeSetState(() => setSessionChecked(true));
      }
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // IMPORTANT: keep this callback synchronous.
      // Never await another Supabase request inside onAuthStateChange.
      safeSetState(() => {
        setIsLoggedIn(Boolean(session));
        setAdminUser(session?.user || null);
        setSessionChecked(true);
      });

      if (session?.user) {
        const userId = session.user.id;

        if (lastProfileUserIdRef.current !== userId) {
          scheduleAdminProfileLoad(userId);
        }
      } else {
        cancelScheduledProfileLoad();
        profileFetchIdRef.current += 1;
        lastProfileUserIdRef.current = null;

        safeSetState(() => {
          setAdminProfile(null);
          setProfileLoading(false);
          setProfileError("");
          setProfileRetryCount(0);
        });
      }
    });

    return () => {
      mountedRef.current = false;
      cancelScheduledProfileLoad();
      profileFetchIdRef.current += 1;

      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
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

        // Do not load the profile here as well.
        // SIGNED_IN will trigger the listener above, which schedules it.
      }

      safeSetState(() => {
        setEmail("");
        setPassword("");
      });
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login request timed out or failed. Check internet and try again.");
    }
  };

  const logout = async () => {
    cancelScheduledProfileLoad();
    profileFetchIdRef.current += 1;
    lastProfileUserIdRef.current = null;

    try {
      await withTimeout(supabase.auth.signOut(), "Logout");
    } catch (error) {
      console.error("Logout timeout/error:", error);
    }

    safeSetState(() => {
      setIsLoggedIn(false);
      setSessionChecked(true);
      setAdminUser(null);
      setAdminProfile(null);
      setProfileLoading(false);
      setProfileError("");
      setProfileRetryCount(0);
    });

    if (typeof onLogoutCleanup === "function") {
      onLogoutCleanup();
    }
  };

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
