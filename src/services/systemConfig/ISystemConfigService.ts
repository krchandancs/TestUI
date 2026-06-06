import { ServiceResult } from '../types';

export interface SystemConfig {
  labName: string;
  labCode: string;
  timezone: string;
  lis: {
    enabled: boolean;
    vendor: string;
    host: string;
    port: number;
    protocol: 'HL7v2' | 'FHIR' | 'Custom';
    autoAccession: boolean;
  };
  qc: {
    randomReviewRate: number;
    positiveReviewRate: number;
    reviewWindowDays: number;
    discordanceAlertThreshold: number;
    positiveSnomedCodes: string[];
  };
  reporting: {
    defaultDeliveryMethod: 'Fax' | 'Email' | 'Print';
    logoUrl: string;
    footerText: string;
  };
}

export interface ISystemConfigService {
  get(): Promise<ServiceResult<SystemConfig>>;
  update(changes: Partial<SystemConfig>): Promise<ServiceResult<SystemConfig>>;
}
