import { EnterpriseConfig } from './EnterpriseConfig';
import { HospitalConfig } from './HospitalConfig';

export function isReportingPlusEnabled(
  enterprise: EnterpriseConfig | null,
  hospital: HospitalConfig | null
): boolean {
  if (!enterprise || !hospital) return false;

  return (
    enterprise.features.reportingPlusEnabled &&
    hospital.features.reportingPlusEnabled
  );
}