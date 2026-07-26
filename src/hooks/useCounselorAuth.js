import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AUTH_TIMEOUT_MS = 15000;
const COUNSELOR_ROLE = "counselor";
const COUNSELOR_PROFILE_TABLE = "counselor_profiles";

function normalizeRole(value) {
  return String(value || "").trim().toLowerCase();
}

function hasCounselorRole(user) {
  if (!user) return false;

  const appMetadata = user.app_metadata || {};
  const roles = Array.isArray(appMetadata.roles)
    ? appMetadata.roles.map(normalizeRole)
    : [];

  return (
    normalizeRole(appMetadata.role) === COUNSELOR_ROLE ||
    roles.includes(COUNSELOR_ROLE)
  );
}

function normalizeProfile(profile = {}, user = null) {
  const metadata = user?.user_metadata || {};

  return {
    ...profile,
    counselorId:
      profile.counselorId ||
      profile.id ||
      profile.user_id ||
      profile.auth_id ||
      user?.id ||
      "",
    id: profile.id || profile.counselorId || user?.id || "",
    user_id: profile.user_id || user?.id || "",
    auth_id: profile.auth_id || user?.id || "",
    email: profile.email || user?.email || "",
    displayName:
      profile.displayName ||
      profile.full_name ||
      profile.name ||
      metadata.full_name ||
      metadata.name ||
      user?.email ||
      "Counselor",
    full_name:
      profile.full_name ||
      profile.displayName ||
      profile.name ||
      metadata.full_name ||
      metadata.name ||
      user?.email ||
      "Counselor",
    role: COUNSELOR_ROLE,
    avatar:
      profile.avatar ||
      profile.avatar_url ||
      metadata.avatar_url ||
      metadata.picture ||
      "",
  };
}

function withTimeout(promise, label, timeoutMs = AUTH_TIMEOUT_MS) {
  let timer;

  const timeoutPromise = new Promise((_, reject) => {
    timer = globalThis.setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    globalThis.clearTimeout(timer);
  });
}

function isMissingRelationError(error) {
  const message = String(error?.message || "").toLowerCase();

  return (
    error?.code === "42P01" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  );
}

function isMissingColumnError(error) {
  const message = String(error?.message || "").toLowerCase();

  return (
    error?.code === "42703" ||
    error?.code === "PGRST204" ||
    message.includes("column") && message.includes("does not exist")
  );
}

async function queryCounselorProfileBy(field, value) {
  if (!value) return { data: null, error: null };

  return withTimeout(
    supabase
      .from(COUNSELOR_PROFILE_TABLE)
      .select("*")
      .eq(field, value)
      .maybeSingle(),
    `Counselor profile lookup (${field})`
  );
}

async function fetchCounselorProfile(user) {
  if (!user) return { profile: null, source: "missing-user", error: null };

  // Server-controlled app_metadata is the preferred authorization source.
  // When it says counselor, the profile table becomes optional enrichment.
  const roleVerifiedByAuth = hasCounselorRole(user);

  const lookupFields = [
    ["user_id", user.id],
    ["auth_id", user.id],
    ["email", user.email],
  ];

  let tableMissing = false;
  let lastError = null;

  for (const [field, value] of lookupFields) {
    try {
      const { data, error } = await queryCounselorProfileBy(field, value);

      if (!error && data) {
        const rowRole = normalizeRole(
          data.role || data.user_role || data.account_role || COUNSELOR_ROLE
        );

        const rowActive =
          data.is_active !== false &&
          normalizeRole(data.status) !== "inactive" &&
          normalizeRole(data.status) !== "disabled";

        if (rowRole !== COUNSELOR_ROLE || !rowActive) {
          return {
            profile: null,
            source: "profile-denied",
            error: new Error("This counselor account is disabled or does not have counselor access."),
          };
        }

        return {
          profile: normalizeProfile(data, user),
          source: "counselor-profile",
          error: null,
        };
      }

      if (error) {
        if (isMissingRelationError(error)) {
          tableMissing = true;
          break;
        }

        if (isMissingColumnError(error)) {
          continue;
        }

        lastError = error;
      }
    } catch (error) {
      if (isMissingRelationError(error)) {
        tableMissing = true;
        break;
      }

      if (isMissingColumnError(error)) {
        continue;
      }

      lastError = error;
    }
  }

  if (roleVerifiedByAuth) {
    return {
      profile: normalizeProfile({}, user),
      source: tableMissing ? "app-metadata-no-profile-table" : "app-metadata",
      error: lastError,
    };
  }

  return {
    profile: null,
    source: tableMissing ? "missing-role-and-profile-table" : "unverified-role",
    error:
      lastError ||
      new Error(
        "Authenticated account is not verified as a counselor. Add counselor role in Supabase app_metadata or a counselor_profiles row."
      ),
  };
}

export default function useCounselorAuth() {
  const mountedRef = useRef(false);
  const verificationIdRef = useRef(0);
  const verifiedUserIdRef = useRef("");
  const counselorProfileRef = useRef(null);
  const authorizationSourceRef = useRef("");
  const backgroundVerificationRef = useRef(null);

  const [sessionChecked, setSessionChecked] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCounselor, setIsCounselor] = useState(false);

  const [user, setUser] = useState(null);
  const [counselorProfile, setCounselorProfile] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [authError, setAuthError] = useState("");
  const [authorizationSource, setAuthorizationSource] = useState("");
  const [authorizationChecked, setAuthorizationChecked] = useState(false);

  const safely = useCallback((callback) => {
    if (mountedRef.current) callback();
  }, []);

  const rememberVerifiedProfile = useCallback((profile, source = "verified") => {
    const userId = String(profile?.user_id || profile?.auth_id || profile?.counselorId || profile?.id || "");

    verifiedUserIdRef.current = userId;
    counselorProfileRef.current = profile || null;
    authorizationSourceRef.current = source || "verified";
  }, []);

  const forgetVerifiedProfile = useCallback(() => {
    verifiedUserIdRef.current = "";
    counselorProfileRef.current = null;
    authorizationSourceRef.current = "";
    backgroundVerificationRef.current = null;
  }, []);

  const clearAuthorization = useCallback(
    (checked = false) => {
      forgetVerifiedProfile();

      safely(() => {
        setIsCounselor(false);
        setCounselorProfile(null);
        setAuthorizationSource("");
        setAuthorizationChecked(checked);
      });
    },
    [forgetVerifiedProfile, safely]
  );

  const verifyUser = useCallback(
    async (nextUser, options = {}) => {
      const {
        preserveVerifiedAccess = false,
        background = false,
      } = options;

      const verificationId = verificationIdRef.current + 1;
      verificationIdRef.current = verificationId;

      if (!nextUser) {
        clearAuthorization(true);

        safely(() => {
          setIsAuthenticated(false);
          setUser(null);
          setVerifying(false);
        });

        return null;
      }

      const nextUserId = String(nextUser.id || "");
      const canPreserveAccess =
        preserveVerifiedAccess &&
        Boolean(nextUserId) &&
        verifiedUserIdRef.current === nextUserId &&
        Boolean(counselorProfileRef.current);

      // First-time verification still gets the secure loader.
      // Routine refresh/re-auth events for an already verified counselor do not
      // tear down the portal while authorization is checked in the background.
      safely(() => {
        setIsAuthenticated(true);
        setUser(nextUser);
        setAuthError("");

        if (!canPreserveAccess) {
          setVerifying(true);
          setAuthorizationChecked(false);
          setIsCounselor(false);
          setCounselorProfile(null);
          setAuthorizationSource("");
        } else {
          setVerifying(false);
          setAuthorizationChecked(true);
          setIsCounselor(true);
          setCounselorProfile(counselorProfileRef.current);
          setAuthorizationSource(
            authorizationSourceRef.current || "verified"
          );
        }
      });

      try {
        const result = await fetchCounselorProfile(nextUser);

        if (
          !mountedRef.current ||
          verificationIdRef.current !== verificationId
        ) {
          return null;
        }

        if (!result.profile) {
          // If a background check genuinely says access is gone, revoke it.
          // Until that concrete result exists, the already verified workspace
          // remains mounted instead of flashing the verification screen.
          forgetVerifiedProfile();

          safely(() => {
            setIsCounselor(false);
            setCounselorProfile(null);
            setAuthorizationSource(result.source || "");
            setAuthorizationChecked(true);
            setAuthError(
              result.error?.message ||
                "This account does not have access to the Counselor Portal."
            );
          });

          return null;
        }

        rememberVerifiedProfile(
          result.profile,
          result.source || "verified"
        );

        safely(() => {
          setIsCounselor(true);
          setCounselorProfile(result.profile);
          setAuthorizationSource(result.source || "verified");
          setAuthorizationChecked(true);
          setAuthError("");
        });

        return result.profile;
      } catch (error) {
        console.error("Counselor authorization failed:", error);

        // A temporary network/profile lookup failure during a background auth
        // refresh should not eject a counselor who was already verified.
        if (canPreserveAccess && background) {
          safely(() => {
            setIsAuthenticated(true);
            setIsCounselor(true);
            setCounselorProfile(counselorProfileRef.current);
            setAuthorizationSource(
              authorizationSourceRef.current || "verified"
            );
            setAuthorizationChecked(true);
            setAuthError("");
          });

          return counselorProfileRef.current;
        }

        forgetVerifiedProfile();

        safely(() => {
          setIsCounselor(false);
          setCounselorProfile(null);
          setAuthorizationSource("verification-error");
          setAuthorizationChecked(true);
          setAuthError(
            error?.message ||
              "Counselor access could not be verified. Please try again."
          );
        });

        return null;
      } finally {
        if (!background) {
          safely(() => setVerifying(false));
        }
      }
    },
    [
      clearAuthorization,
      forgetVerifiedProfile,
      rememberVerifiedProfile,
      safely,
    ]
  );

  useEffect(() => {
    mountedRef.current = true;

    const boot = async () => {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          "Counselor session check"
        );

        if (error) throw error;

        await verifyUser(data.session?.user || null);
      } catch (error) {
        console.error("Counselor session check failed:", error);

        safely(() => {
          setIsAuthenticated(false);
          setIsCounselor(false);
          setUser(null);
          setCounselorProfile(null);
          setAuthorizationChecked(true);
          setAuthError(
            "We could not verify your current session. Check your connection and try again."
          );
        });
      } finally {
        safely(() => setSessionChecked(true));
      }
    };

    void boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user || null;
      const nextUserId = String(nextUser?.id || "");

      if (!nextUser) {
        verificationIdRef.current += 1;
        forgetVerifiedProfile();

        safely(() => {
          setIsAuthenticated(false);
          setUser(null);
          setVerifying(false);
          setAuthorizationChecked(true);
          setIsCounselor(false);
          setCounselorProfile(null);
          setAuthorizationSource("");
          setSessionChecked(true);
        });

        return;
      }

      const alreadyVerifiedSameUser =
        Boolean(nextUserId) &&
        verifiedUserIdRef.current === nextUserId &&
        Boolean(counselorProfileRef.current);

      // TOKEN_REFRESHED is routine Supabase housekeeping. Do not re-run the
      // visible authorization gate or unmount the portal for the same verified user.
      if (event === "TOKEN_REFRESHED" && alreadyVerifiedSameUser) {
        safely(() => {
          setIsAuthenticated(true);
          setUser(nextUser);
          setIsCounselor(true);
          setCounselorProfile(counselorProfileRef.current);
          setAuthorizationSource(
            authorizationSourceRef.current || "verified"
          );
          setAuthorizationChecked(true);
          setVerifying(false);
          setSessionChecked(true);
        });

        return;
      }

      // SIGNED_IN can also fire again for an existing session. Keep the portal
      // visible and verify quietly instead of showing the launch screen again.
      if (alreadyVerifiedSameUser) {
        safely(() => {
          setIsAuthenticated(true);
          setUser(nextUser);
          setIsCounselor(true);
          setCounselorProfile(counselorProfileRef.current);
          setAuthorizationSource(
            authorizationSourceRef.current || "verified"
          );
          setAuthorizationChecked(true);
          setVerifying(false);
          setSessionChecked(true);
        });

        if (!backgroundVerificationRef.current) {
          const request = verifyUser(nextUser, {
            preserveVerifiedAccess: true,
            background: true,
          }).finally(() => {
            if (backgroundVerificationRef.current === request) {
              backgroundVerificationRef.current = null;
            }
          });

          backgroundVerificationRef.current = request;
        }

        return;
      }

      // First authenticated handoff: normal visible verification.
      safely(() => {
        setIsAuthenticated(true);
        setUser(nextUser);
        setVerifying(true);
        setAuthorizationChecked(false);
        setIsCounselor(false);
        setCounselorProfile(null);
        setAuthorizationSource("");
        setSessionChecked(true);
      });

      void verifyUser(nextUser);
    });

    return () => {
      mountedRef.current = false;
      verificationIdRef.current += 1;
      backgroundVerificationRef.current = null;
      subscription?.unsubscribe();
    };
  }, [safely, verifyUser]);

  const login = useCallback(
    async (event) => {
      event?.preventDefault?.();

      const cleanEmail = email.trim();

      if (!cleanEmail || !password) {
        setAuthError("Enter your counselor email and password.");
        return false;
      }

      setAuthError("");
      setAuthorizationChecked(false);
      setVerifying(true);

      try {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          }),
          "Counselor login"
        );

        if (error) throw error;

        if (!data.user) {
          throw new Error("Supabase did not return an authenticated user.");
        }

        const profile = await verifyUser(data.user);

        if (!profile) {
          await supabase.auth.signOut();
          return false;
        }

        safely(() => {
          setEmail("");
          setPassword("");
        });

        return true;
      } catch (error) {
        console.error("Counselor login failed:", error);

        safely(() => {
          setAuthError(
            error?.message ||
              "Counselor login failed. Check your credentials and try again."
          );
        });

        return false;
      } finally {
        safely(() => setVerifying(false));
      }
    },
    [email, password, safely, verifyUser]
  );

  const logout = useCallback(async () => {
    verificationIdRef.current += 1;
    forgetVerifiedProfile();

    try {
      await withTimeout(supabase.auth.signOut(), "Counselor logout");
    } catch (error) {
      console.error("Counselor logout failed:", error);
    } finally {
      safely(() => {
        setIsAuthenticated(false);
        setIsCounselor(false);
        setUser(null);
        setCounselorProfile(null);
        setPassword("");
        setAuthError("");
        setAuthorizationSource("");
        setAuthorizationChecked(true);
      });
    }
  }, [forgetVerifiedProfile, safely]);

  const retryAuthorization = useCallback(async () => {
    setAuthError("");
    setAuthorizationChecked(false);
    setVerifying(true);
    return verifyUser(user);
  }, [user, verifyUser]);

  return {
    sessionChecked,
    verifying,
    isAuthenticated,
    isCounselor,
    user,
    counselorProfile,

    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,

    authError,
    authorizationSource,
    authorizationChecked,

    login,
    logout,
    retryAuthorization,
  };
}
