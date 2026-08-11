import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const normalizedWorkingStudent = useMemo(
    () => ({
      ...(student || {}),
      ...(workingStudent || {}),
      id: studentId || workingStudent?.id || student?.id,
      student_id:
        studentId ||
        workingStudent?.student_id ||
        student?.student_id,
      student_type:
        studentType ||
        workingStudent?.student_type ||
        workingStudent?.__leadType ||
        student?.student_type ||
        student?.__leadType ||
        "inquiry",
      person_id:
        personId ||
        workingStudent?.person_id ||
        student?.person_id ||
        null,
      email:
        portalAccountForm.email ||
        studentEmail ||
        workingStudent?.email ||
        student?.email ||
        "",
    }),
    [
      personId,
      portalAccountForm.email,
      student,
      studentEmail,
      studentId,
      studentType,
      workingStudent,
    ]
  );

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
          ...normalizedWorkingStudent,
          id: studentId,
          student_id: studentId,
          student_type: normalizedWorkingStudent.student_type,
          person_id: normalizedWorkingStudent.person_id,
        });

      if (portalRequestRef.current !== requestId) return null;
      if (result?.error) throw result.error;

      const account = normalizePortalAccount(result?.account || null);

      setPortalAccount(account);
      setPortalAccountForm((prev) => {
        const nextEmail = account?.email || studentEmail || prev.email;

        if (prev.email === nextEmail) return prev;

        return {
          ...prev,
          email: nextEmail,
        };
      });

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
    normalizedWorkingStudent,
    studentEmail,
    studentId,
  ]);

  const callPortalApi = useCallback(
    async (functionName, payload = {}) => {
      const handler = studentPortalApi?.[functionName];

      if (typeof handler !== "function") {
        throw new Error(`${functionName} is not exported from studentPortal.js.`);
      }

      const password =
        payload.password ||
        payload.newPassword ||
        portalAccountForm.resetPassword ||
        portalAccountForm.temporaryPassword;

      const objectPayload = {
        student: normalizedWorkingStudent,
        studentId,
        student_id: studentId,
        studentType: normalizedWorkingStudent.student_type,
        student_type: normalizedWorkingStudent.student_type,
        personId: normalizedWorkingStudent.person_id,
        person_id: normalizedWorkingStudent.person_id,
        email: portalAccountForm.email || studentEmail,
        password,
        newPassword: password,
        temporaryPassword:
          payload.temporaryPassword ||
          portalAccountForm.temporaryPassword,
        resetPassword:
          payload.resetPassword ||
          portalAccountForm.resetPassword,
        mustChangePassword:
          payload.mustChangePassword ??
          portalAccountForm.forcePasswordChange,
        must_change_password:
          payload.must_change_password ??
          portalAccountForm.forcePasswordChange,
        isActive: payload.isActive ?? true,
        is_active: payload.is_active ?? true,
        accountId: payload.accountId || portalAccount?.id || null,
        account_id: payload.account_id || portalAccount?.id || null,
        adminProfile,
        ...payload,
      };

      const result = await handler(objectPayload);

      if (!result) {
        throw new Error(`${functionName} returned no result.`);
      }

      if (result?.success === false || result?.error) {
        throw new Error(
          result?.error?.message ||
          result?.message ||
          `${functionName} failed.`
        );
      }

      return result;
    },
    [
      adminProfile,
      normalizedWorkingStudent,
      portalAccount?.id,
      portalAccountForm,
      studentEmail,
      studentId,
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
            newPassword: passwordToUse,
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

        if (!result || result?.success === false || result?.error) {
          throw new Error(
            result?.error?.message ||
            result?.message ||
            "Portal account action failed."
          );
        }

        const accountFromResult =
          result?.account ||
          (result?.data &&
          typeof result.data === "object" &&
          !Array.isArray(result.data)
            ? result.data
            : null);

        if (accountFromResult) {
          setPortalAccount(normalizePortalAccount(accountFromResult));
        }

        const confirmedAccount = await loadPortalAccount();

        if (!confirmedAccount) {
          throw new Error(
            "The backend responded, but no portal account could be confirmed in the database."
          );
        }

        let credentialEmailWarning = "";

        if (action === "create" || action === "reset") {
          try {
            await studentPortalApi.sendPortalCredentials({
              studentName:
                normalizedWorkingStudent.full_name ||
                normalizedWorkingStudent.student_name ||
                normalizedWorkingStudent.name ||
                normalizedWorkingStudent.first_name ||
                "Student",
              recipientEmail: emailToUse,
              temporaryPassword: passwordToUse,
              mustChangePassword: Boolean(
                portalAccountForm.forcePasswordChange
              ),
              studentId,
              studentType: normalizedWorkingStudent.student_type,
              accountId:
                confirmedAccount?.id ||
                portalAccount?.id ||
                accountFromResult?.id ||
                null,
              action,
            });
          } catch (emailError) {
            console.error("Credential email failed:", emailError);
            credentialEmailWarning =
              emailError?.message ||
              "The credential email could not be sent.";
          }
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
                confirmedAccount?.id ||
                portalAccount?.id ||
                accountFromResult?.id ||
                null,
              email: emailToUse,
              person_id: normalizedWorkingStudent.person_id || null,
            },
          });
        }

        setPortalAccountStatus({
          type: credentialEmailWarning ? "warning" : "success",
          message:
            action === "create"
              ? credentialEmailWarning
                ? `Portal account created and confirmed, but the credentials email failed: ${credentialEmailWarning}`
                : "Portal account created, confirmed, and credentials emailed to the student."
              : action === "reset"
              ? credentialEmailWarning
                ? `Password reset completed, but the updated credentials email failed: ${credentialEmailWarning}`
                : "Password reset completed and the new temporary password was emailed to the student."
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
      normalizedWorkingStudent.person_id,
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
