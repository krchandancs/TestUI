// src/components/SimilarCases/PatientHistoryTab.tsx
import React from 'react';
import '../../pathscribe.css';

/** Summary of a prior case for the same patient */
export interface PatientCaseSummary {
  accession: string;
  specimen:  string;
  diagnosis: string;
  date:      string;
}

interface PatientHistoryTabProps {
  patientHistory: PatientCaseSummary[];
  onOpenCase: (accession: string) => void;
}

const PatientHistoryTab: React.FC<PatientHistoryTabProps> = ({
  patientHistory,
  onOpenCase,
}) => {
  if (patientHistory.length === 0) {
    return <div className="ps-hist-empty">No prior cases found for this patient.</div>;
  }

  return (
    <div className="ps-hist-tab">
      <div className="ps-hist-note">
        Same patient only. Chronological view of prior cases and reports.
      </div>
      <div className="ps-hist-list">
        {patientHistory.map(item => (
          <div key={item.accession} className="ps-hist-card">
            <div className="ps-hist-card__header">
              <span className="ps-hist-card__accession" data-phi="accession">{item.accession}</span>
              <span className="ps-hist-card__date">{item.date}</span>
            </div>
            <div className="ps-hist-card__specimen">{item.specimen}</div>
            <div className="ps-hist-card__diagnosis">{item.diagnosis}</div>
            <button type="button" onClick={() => onOpenCase(item.accession)} className="ps-hist-card__open-btn">
              Open Case
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientHistoryTab;
