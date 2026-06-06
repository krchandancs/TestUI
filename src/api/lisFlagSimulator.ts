import { FlagDefinition } from "../../types/FlagDefinition";
import { getFlags, createFlag } from "../../api/flagsApi";

export const simulateLisFlag = async (incomingCode: string, level: "case" | "specimen") => {
  const flags = await getFlags();
  const existing = flags.find(f => f.lisCode === incomingCode);

  if (existing) {
    console.log("LIS flag resolved:", existing);
    return existing;
  }

  // Auto-create
  const newFlag: Partial<FlagDefinition> = {
    name: incomingCode,
    description: "Auto-created from LIS",
    level,
    lisCode: incomingCode,
    active: true
  };

  await createFlag(newFlag);

  console.log("Auto-created LIS flag:", newFlag);
  return newFlag;
};
