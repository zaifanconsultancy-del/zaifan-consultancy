// One question used everywhere a file is closed: "why?". The answer is saved
// in the history and counted on the Reports page.

import { useCallback } from "react";

import { useAdminData } from "../data/AdminDataProvider";
import { CLOSE_REASONS } from "../lib/people";
import { useConfirm } from "./kit";

export default function useCloseFile() {
  const confirm = useConfirm();
  const { setStage } = useAdminData();

  return useCallback(
    async (person) => {
      const answer = await confirm({
        title: `Close ${person.name}'s file?`,
        text: "Pick the reason, so the Reports page can show why people do not go ahead. You can reopen the file any time.",
        choices: CLOSE_REASONS,
        noteLabel: "Anything to remember",
        confirmLabel: "Close file",
        danger: true,
      });
      if (!answer) return false;
      await setStage(person, "closed", { reason: answer.choice, note: answer.note });
      return true;
    },
    [confirm, setStage]
  );
}
