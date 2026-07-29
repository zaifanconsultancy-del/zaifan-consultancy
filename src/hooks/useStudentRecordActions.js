import { useCallback, useState } from "react";
import { addTimelineEvent } from "../lib/crmTimeline";
import { getPipelineStageById } from "../data/crmPipelineConfig";

export default function useStudentRecordActions({
  workingStudent,
  setLocalStudent,

  studentType,
  pipelineType,
  currentStageId,
  currentStage,

  priority,
  status,

  isAppointment,
  isInquiry,

  fullName,
  adminProfile,
  permissions,

  updateInquiryPriority,
  updateAppointmentPriority,
  updateAppointmentStatus,
  updateAppointmentStage,
  updateInquiryStage,
  toggleInquiryStatus,
}) {
  const [savingStage, setSavingStage] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const handlePriorityChange = useCallback(
    async (newPriority) => {
      if (
        !permissions?.canUpdatePriority ||
        newPriority === priority ||
        savingPriority
      ) {
        return;
      }

      const oldPriority = priority;

      setLocalStudent((prev) => ({
        ...(prev || workingStudent),
        priority: newPriority,
      }));

      setSavingPriority(true);

      try {
        if (isAppointment && typeof updateAppointmentPriority === "function") {
          await updateAppointmentPriority(workingStudent.id, newPriority);
        }

        if (isInquiry && typeof updateInquiryPriority === "function") {
          await updateInquiryPriority(workingStudent.id, newPriority);
        }

        await addTimelineEvent({
          studentId: workingStudent.id,
          studentType,
          actionType: "priority_changed",
          title: "Priority Updated",
          description: `${fullName}'s priority was updated.`,
          oldValue: oldPriority,
          newValue: newPriority,
          adminProfile,
        });
      } catch (error) {
        setLocalStudent((prev) => ({
          ...(prev || workingStudent),
          priority: oldPriority,
        }));

        alert(error?.message || "Priority update failed.");
      } finally {
        setSavingPriority(false);
      }
    },
    [
      adminProfile,
      fullName,
      isAppointment,
      isInquiry,
      permissions?.canUpdatePriority,
      priority,
      savingPriority,
      setLocalStudent,
      studentType,
      updateAppointmentPriority,
      updateInquiryPriority,
      workingStudent,
    ]
  );

  const handleStatusChange = useCallback(
    async (newStatus) => {
      if (
        !permissions?.canUpdateStatus ||
        newStatus === status ||
        savingStatus
      ) {
        return;
      }

      const oldStatus = status;

      setLocalStudent((prev) => ({
        ...(prev || workingStudent),
        status: newStatus,
        completed: newStatus === "completed",
      }));

      setSavingStatus(true);

      try {
        if (isAppointment && typeof updateAppointmentStatus === "function") {
          await updateAppointmentStatus(workingStudent.id, newStatus);
        }

        if (isInquiry && typeof toggleInquiryStatus === "function") {
          await toggleInquiryStatus(workingStudent.id, newStatus);
        }

        await addTimelineEvent({
          studentId: workingStudent.id,
          studentType,
          actionType: "status_changed",
          title: "Status Updated",
          description: `${fullName}'s status was updated.`,
          oldValue: oldStatus,
          newValue: newStatus,
          adminProfile,
        });
      } catch (error) {
        setLocalStudent((prev) => ({
          ...(prev || workingStudent),
          status: oldStatus,
          completed: oldStatus === "completed",
        }));

        alert(error?.message || "Status update failed.");
      } finally {
        setSavingStatus(false);
      }
    },
    [
      adminProfile,
      fullName,
      isAppointment,
      isInquiry,
      permissions?.canUpdateStatus,
      savingStatus,
      setLocalStudent,
      status,
      studentType,
      toggleInquiryStatus,
      updateAppointmentStatus,
      workingStudent,
    ]
  );

  const handleStageChange = useCallback(
    async (stageId) => {
      if (!stageId || stageId === currentStageId || savingStage) return;

      const persistenceHandler = isAppointment
        ? updateAppointmentStage
        : updateInquiryStage;

      if (typeof persistenceHandler !== "function") {
        alert(
          `${
            isAppointment ? "Appointment" : "Inquiry"
          } pipeline-stage persistence is not connected yet. No local-only stage change was applied.`
        );
        return;
      }

      const nextStage = getPipelineStageById(pipelineType, stageId);
      const oldStageId = currentStageId;

      setLocalStudent((prev) => ({
        ...(prev || workingStudent),
        pipeline_stage: stageId,
        stage: stageId,
        appointment_stage: isAppointment
          ? stageId
          : prev?.appointment_stage,
      }));

      setSavingStage(true);

      try {
        await persistenceHandler(workingStudent.id, stageId);

        await addTimelineEvent({
          studentId: workingStudent.id,
          studentType,
          actionType: "pipeline_stage_changed",
          title: "Pipeline Stage Updated",
          description: `${fullName} moved in the CRM pipeline.`,
          oldValue: currentStage?.label || currentStageId,
          newValue: nextStage?.label || stageId,
          adminProfile,
          metadata: {
            old_stage_id: currentStageId,
            new_stage_id: stageId,
          },
        });
      } catch (error) {
        setLocalStudent((prev) => ({
          ...(prev || workingStudent),
          pipeline_stage: oldStageId,
          stage: oldStageId,
          appointment_stage: isAppointment
            ? oldStageId
            : prev?.appointment_stage,
        }));

        alert(error?.message || "Pipeline stage update failed.");
      } finally {
        setSavingStage(false);
      }
    },
    [
      adminProfile,
      currentStage,
      currentStageId,
      fullName,
      isAppointment,
      pipelineType,
      savingStage,
      setLocalStudent,
      studentType,
      updateAppointmentStage,
      updateInquiryStage,
      workingStudent,
    ]
  );

  return {
    savingStage,
    savingPriority,
    savingStatus,
    handlePriorityChange,
    handleStatusChange,
    handleStageChange,
  };
}
