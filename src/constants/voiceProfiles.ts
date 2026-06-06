/**
 * src/constants/voiceProfiles.ts
 * * Defines the regional linguistic profiles for AI transcription.
 */

export interface VoiceProfile {
  readonly id: string;
  readonly label: string;
}

export const VOICE_PROFILES: readonly VoiceProfile[] = [
  { id: 'EN-US',     label: 'Standard English (US)' },
  { id: 'EN-CA',     label: 'Canadian English' },
  { id: 'EN-GB',     label: 'British English (Standard)' },
  { id: 'EN-GB-SCT', label: 'Scottish' },
  { id: 'EN-IE',     label: 'Ireland (Republic & Northern)' },
  { id: 'EN-IN',     label: 'Indian Subcontinent (IMG)' },
  { id: 'EN-PH',     label: 'Filipino / SE Asian' },
  { id: 'EN-SG',     label: 'Singaporean / Malay' },
  { id: 'EN-CN',     label: 'East Asian (Focus)' },
  { id: 'EN-EE',     label: 'Eastern European' },
  { id: 'EN-DE',     label: 'Western European (Germanic)' },
  { id: 'EN-AU',     label: 'Australian / NZ' },
  { id: 'EN-ZA',     label: 'South African' },
  { id: 'EN-NG',     label: 'West African' },
  { id: 'EN-ME',     label: 'Middle Eastern' },
] as const;

/**
 * Union type of all valid Voice Profile IDs
 */
export type VoiceProfileId = typeof VOICE_PROFILES[number]['id'];

/**
 * Retrieves the display label for a given profile ID.
 * Returns "System Default (Inherited)" if the ID is null or undefined, 
 * allowing the UI to reflect that the Global Voice Setting is in use.
 */
export const getVoiceProfileLabel = (id: string | undefined | null): string => {
  if (!id) {
    return 'System Default (Inherited)';
  }

  const profile = VOICE_PROFILES.find(
    (p) => p.id.toUpperCase() === id.toUpperCase()
  );

  return profile ? profile.label : 'System Default (Inherited)';
};
