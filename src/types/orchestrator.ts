export interface OrchestratorContext {
  adminHeader: {
    patientDemographics: any[];
    accessionNumber: string;
    orderingPhysicians: any[];
    clinicalHistory: string | null;
    preOpDiagnosis: string | null;
  };

  grossDescription: {
    specimens: {
      label: string;
      procedure: string;
      measurements: string;
      integrity: string;
      blockIndex: any[];
    }[];
  };

  synopticData: {
    histologicType: string | null;
    histologicGrade: string | null;
    tumorSize: string | null;
    marginStatus: any[];
    lymphovascularInvasion: string | null;
    pTNMStage: string | null;
    lymphNodeStatus: any[];
  };

  ancillaryAndDiagnosis: {
    ihc: any[];
    molecular: any[];
    finalDiagnosis: string | null;
    comment: string | null;
  };

  metadata: {
    caseId: string;
    timestamp: string;
    pathologist: string;
    templateId: string;
  };
}