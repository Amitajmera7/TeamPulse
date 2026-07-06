import { TEAM_MAPPING } from "@/config/team-mapping";

export function getTechByDeveloper(
  developer: string
): string | null {

  for (const [tech, members] of Object.entries(
    TEAM_MAPPING
  )) {
    if (members.includes(developer)) {
      return tech;
    }
  }

  return null;
}