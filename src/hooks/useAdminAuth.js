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

  const safeSetState = (callback) => {
    if (mountedRef.current) callback();
  };

  const loadAdminProfile = async (userId, options = {}) => {
    if (!userId) return null;

    const { force = false } = options;
    const fetchId = profileFetchIdRef.current + 1;
    profileFetchIdRef.current = fetchId;

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

  useEffect(() => {
    mountedRef.current = true;

    const checkSession = async () => {
      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          "Session check"
        );

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
          });
        }
      } catch (error) {
        console.error("Session check failed:", error);

        safeSetState(() => {
          setIsLoggedIn(false);
          setAdminUser(null);
          setAdminProfile(null);
          setProfileLoading(false);
        });
      } finally {
        safeSetState(() => setSessionChecked(true));
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      safeSetState(() => {
        setIsLoggedIn(!!session);
        setAdminUser(session?.user || null);
      });

      if (session?.user) {
        await loadAdminProfile(session.user.id);
      } else {
        safeSetState(() => {
          setAdminProfile(null);
          setProfileLoading(false);
        });
      }

      safeSetState(() => setSessionChecked(true));
    });

    return () => {
      mountedRef.current = false;
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
        safeSetState(() => setAdminUser(data.user));
        await loadAdminProfile(data.user.id);
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