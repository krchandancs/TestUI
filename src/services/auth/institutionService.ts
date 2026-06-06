// src/services/auth/institutionService.ts
// Returns the institution ID for the current session.
// TODO: derive from authenticated user's JWT claims when multi-tenancy is live.

export async function getInstitutionId(): Promise<string> {
  return localStorage.getItem('ps_institution_id') ?? 'HOSP-001';
}