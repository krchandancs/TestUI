export interface EnterpriseFeatures {
  reportingPlusEnabled: boolean; // default false
}

export interface EnterpriseConfig {
  id: string;
  name: string;
  features: EnterpriseFeatures;
}