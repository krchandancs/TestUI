export interface HospitalFeatures {
  reportingPlusEnabled: boolean; // default true
}

export interface HospitalConfig {
  id: string;
  name: string;
  enterpriseId: string;
  features: HospitalFeatures;
}