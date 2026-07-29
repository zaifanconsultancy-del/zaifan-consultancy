import { useCallback, useEffect, useRef, useState } from "react";
import * as studentPortalApi from "../lib/studentPortal";

export default function useStudentPortalAccount({
  studentIdentity,
  studentId,
  studentType,
  personId,
  studentEmail,
  student,
  workingStudent,
  adminProfile,
  runWithTimeout,
  fireTimelineEvent,
}) {
  const portalRequestRef = useRef(0);

  const [portalAccount, setPortalAccount] = useState(null);
  const [portalAccountLoading, setPortalAccountLoading] = useState(false);
  const [portalAccountSaving, setPortalAccountSaving] = useState("");
  const [portalAccountStatus, setPortalAccountStatus] = useState({
    type: "",
    message: "",
  });
  const [portalAccountForm, setPortalAccountForm] = useState({
    email: studentEmail || "",
    temporaryPassword: "",
    resetPassword: "",
    forcePasswordChange: true,
  });

  const normalizePortalAccount = useCallback(
    (account = null) => {
      if (!account) return null;

      const isActive =
        account.is_active ??
        account.active ??
        (account.status === "active") ??
        true;

      return {
        ...account,
        email: account.email || account.student_email || studentEmail,
        is_active: Boolean(isActive),
        must_change_password: Boolean(account.must_change_password),
        last_login_at: account.last_login_at || account.last_login || null,
        password_changed_at:
          account.password_changed_at || account.password_updated_at || null,
      };
    },
    [studentEmail]
  );

  const generateSecurePortalPassword = useCallback(() => {
    const alphabet =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const values = new Uint32Array(16);

    if (
      typeof window !== "undefined" &&
      window.crypto?.getRandomValues
    ) {
      window.crypto.getRandomValues(values);
    } else {
      for (let index = 0; index < values.length; index += 1) {
        values[index] = Math.floor(Math.random() * 0xffffffff);
      }
    }

    const password = Array.from(values)
      .map((value) => alphabet[value % alphabet.length])
      .join("");

    setPortalAccountForm((prev) => ({
      ...prev,
      temporaryPassword: password,
      resetPassword: "",
      forcePasswordChange: true,
    }));

    setPortalAccountStatus({
      type: "info",
      message:
        "A strong temporary password was generated locally. It has not been saved or sent anywhere yet.",
    });

    return password;
  }, []);

  const loadPortalAccount = useCallback(async () => {
    if (!studentId) return null;

    const requestId = portalRequestRef.current + 1;
    portalRequestRef.current = requestId;
    setPortalAccountLoading(true);

    try {
      const result =
        await studentPortalApi.fetchStudentPortalAccountForStudent({
          ...workingStudent,
          id: studentId,
          student_type: studentType,
          person_id: personId || workingStudent?.person_id || null,
        });

      if (portalRequestRef.current !== requestId) return null;
      if (result?.error) throw result.error;

      const account = normalizePortalAccount(result?.account || null);

      setPortalAccount(account);
      setPortalAccountForm((prev) => ({
        ...prev,
        email: account?.email || studentEmail || prev.email,
      }));

      return account;
    } catch (error) {
      if (portalRequestRef.current !== requestId) return null;

      console.warn("Portal account failed to load:", error?.message || error);
      setPortalAccount(null);
      setPortalAccountStatus((prev) =>
        prev.message
          ? prev
          : {
              type: "warning",
              message:
                error?.message ||
                "Portal account could not be loaded for this permanent student identity.",
            }
      );
      return null;
    } finally {
      if (portalRequestRef.current === requestId) {
        setPortalAccountLoading(false);
      }
    }
  }, [
    normalizePortalAccount,
    personId,
    studentEmail,
    studentId,
    studentType,
    workingStudent,
  ]);

  const callPortalApi = useCallback(
    async (functionName, payload = {}) => {
      const handler = studentPortalApi?.[functionName];

      if (typeof handler !== "function") {
        throw new Error(`${functionName} is not exported from studentPortal.js.`);
      }

      const objectPayload = {
        studentId,
        student_id: studentId,
        studentType,
        student_type: studentType,
        personId,
        person_id: personId || workingStudent?.person_id || null,
        email: portalAccountForm.email || studentEmail,
        password:
          payload.password ||
          portalAccountForm.resetPassword ||
          portalAccountForm.temporaryPassword,
        temporaryPassword: portalAccountForm.temporaryPassword,
        resetPassword: portalAccountForm.resetPassword,
        mustChangePassword: portalAccountForm.forcePasswordChange,
        must_change_password: portalAccountForm.forcePasswordChange,
        adminProfile,
        ...payload,
      };

      const attempts = [
        () => handler(objectPayload),
        () => handler(studentId, studentType, objectPayload),
        () =>
          handler(
            studentId,
            studentType,
            objectPayload.email,
            objectPayload.password,
            objectPayload.mustChangePassword
          ),
        () => handler(portalAccount?.id, objectPayload),
      ];

      let lastError = null;

      for (const attempt of attempts) {
        try {
          return await attempt();
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError || new Error(`${functionName} failed.`);
    },
    [
      adminProfile,
      personId,
      portalAccount?.id,
      portalAccountForm,
      studentEmail,
      studentId,
      studentType,
      workingStudent?.person_id,
    ]
  );

  const handlePortalAccountAction = useCallback(
    async (action, options = {}) => {
      if (!studentId || portalAccountSaving) return;

      const actionLabels = {
        create: "Creating portal account",
        reset: "Resetting portal password",
        activate: "Activating portal account",
        deactivate: "Deactivating portal account",
        force_change: "Forcing password change",
      };

      const apiMap = {
        create: "createStudentPortalAccount",
        reset: "resetStudentPortalAccountPassword",
        activate: "activateStudentPortalAccount",
        deactivate: "deactivateStudentPortalAccount",
        force_change: "forceStudentPortalPasswordChange",
      };

      const emailToUse = String(
        portalAccountForm.email || studentEmail || ""
      ).trim();

      const passwordToUse = String(
        action === "reset"
          ? portalAccountForm.resetPassword ||
              portalAccountForm.temporaryPassword
          : portalAccountForm.temporaryPassword
      ).trim();

      if (["create", "reset"].includes(action)) {
        if (!emailToUse) {
          setPortalAccountStatus({
            type: "warning",
            message: "Student email is required.",
          });
          return;
        }

        if (!passwordToUse || passwordToUse.length < 10) {
          setPortalAccountStatus({
            type: "warning",
            message: "Temporary password must be at least 10 characters.",
          });
          return;
        }
      }

      setPortalAccountSaving(action);
      setPortalAccountStatus({
        type: "info",
        message: actionLabels[action] || "Updating portal account",
      });

      try {
        const result = await runWithTimeout(
          callPortalApi(apiMap[action], {
            email: emailToUse,
            password: passwordToUse,
            temporaryPassword: passwordToUse,
            resetPassword: passwordToUse,
            isActive: action !== "deactivate",
            is_active: action !== "deactivate",
            mustChangePassword:
              action === "force_change"
                ? true
                : portalAccountForm.forcePasswordChange,
            must_change_password:
              action === "force_change"
                ? true
                : portalAccountForm.forcePasswordChange,
            accountId: portalAccount?.id,
            account_id: portalAccount?.id,
            ...options,
          }),
          actionLabels[action] || "Portal account action",
          20000
        );

        const accountFromResult =
          result?.account || result?.data || result;

        if (
          accountFromResult &&
          typeof accountFromResult === "object" &&
          !Array.isArray(accountFromResult)
        ) {
          setPortalAccount(normalizePortalAccount(accountFromResult));
        }

        if (typeof fireTimelineEvent === "function") {
          await fireTimelineEvent({
            actionType: `portal_account_${action}`,
            title: "Portal Account Updated",
            description: `Portal account action completed: ${action.replace(
              /_/g,
              " "
            )}.`,
            request: null,
            metadata: {
              portal_account_id:
                portalAccount?.id || accountFromResult?.id || null,
              email: emailToUse,
              person_id: personId || null,
            },
          });
        }

        await loadPortalAccount();

        setPortalAccountStatus({
          type: "success",
          message:
            action === "create"
              ? "Portal account created. Share the temporary password with the student."
              : action === "reset"
              ? "Password reset completed. Student should use the new temporary password."
              : action === "activate"
              ? "Portal account activated."
              : action === "deactivate"
              ? "Portal account deactivated. Student login is blocked."
              : "Student will be forced to change password on next login.",
        });

        setPortalAccountForm((prev) => ({
          ...prev,
          resetPassword: "",
        }));
      } catch (error) {
        console.error("Portal account action failed:", error);

        setPortalAccountStatus({
          type: "warning",
          message: error?.message || "Portal account action failed.",
        });

        await loadPortalAccount();
      } finally {
        setPortalAccountSaving("");
      }
    },
    [
      callPortalApi,
      fireTimelineEvent,
      loadPortalAccount,
      normalizePortalAccount,
      personId,
      portalAccount?.id,
      portalAccountForm,
      portalAccountSaving,
      runWithTimeout,
      studentEmail,
      studentId,
    ]
  );

  useEffect(() => {
    portalRequestRef.current += 1;

    setPortalAccount(null);
    setPortalAccountLoading(false);
    setPortalAccountSaving("");
    setPortalAccountStatus({ type: "", message: "" });
    setPortalAccountForm({
      email: student?.email || studentEmail || "",
      temporaryPassword: "",
      resetPassword: "",
      forcePasswordChange: true,
    });
  }, [studentIdentity, student?.email, studentEmail]);

  useEffect(() => {
    loadPortalAccount();
  }, [loadPortalAccount]);

  return {
    portalAccount,
    portalAccountLoading,
    portalAccountSaving,
    portalAccountStatus,
    portalAccountForm,
    setPortalAccountForm,
    generateSecurePortalPassword,
    loadPortalAccount,
    handlePortalAccountAction,
  };
}
