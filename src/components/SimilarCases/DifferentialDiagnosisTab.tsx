// src/components/SimilarCases/DifferentialDiagnosisTab.tsx
import React from 'react';
import '../../pathscribe.css';

/** Summary of a similar case from the AI matching engine */
export interface SimilarCaseSummary {
  accession:  string;
  specimen:   string;
  diagnosis:  string;
  similarity: number;
  keyMatches: string[];
}

interface DifferentialDiagnosisTabProps {
  similarCases: SimilarCaseSummary[];
  aiConfidence: 'high' | 'medium' | 'low';
  onRefineSearch?: () => void;
  onOpenCase: (accession: string) => void;
}

const DifferentialDiagnosisTab: React.FC<DifferentialDiagnosisTabProps> = ({
  similarCases,
  aiConfidence,
  onRefineSearch,
  onOpenCase,
}) => {
  const confidenceClass =
    aiConfidence === 'high' ? 'ps-diff-confidence--high' :
    aiConfidence === 'medium' ? 'ps-diff-confidence--medium' :
    'ps-diff-confidence--low';

  const confidenceLabel =
    aiConfidence === 'high' ? 'AI found strong matches based on structured data.' :
    aiConfidence === 'medium' ? 'AI found some matches. Review before relying on them.' :
    'Matches are weak. Consider refining search manually.';

  return (
    <div className="ps-diff-tab">
      <div className={`ps-diff-confidence ${confidenceClass}`}>
        AI-proposed similar cases from other patients. {confidenceLabel}
      </div>

      {similarCases.length === 0 && (
        <div className="ps-diff-empty">No similar cases found.</div>
      )}

      <div className="ps-diff-list">
        {similarCases.map(c => (
          <div key={c.accession} className="ps-diff-card">
            <div className="ps-diff-card__header">
              <span className="ps-diff-card__accession" data-phi="accession">{c.accession}</span>
              <span className="ps-diff-card__match">{c.similarity}% match</span>
            </div>
            <div className="ps-diff-card__specimen">{c.specimen}</div>
            <div className="ps-diff-card__diagnosis">{c.diagnosis}</div>
            {c.keyMatches.length > 0 && (
              <div className="ps-diff-card__matches">
                {c.keyMatches.map((m, idx) => (
                  <span key={idx} className="ps-diff-card__match-chip">{m}</span>
                ))}
              </div>
            )}
            <button type="button" onClick={() => onOpenCase(c.accession)} className="ps-diff-card__open-btn">
              Open Case
            </button>
          </div>
        ))}
      </div>

      {onRefineSearch && (
        <div className="ps-diff-refine">
          <button type="button" onClick={onRefineSearch} className="ps-diff-refine-btn">
            Refine Search Manually
          </button>
        </div>
      )}
    </div>
  );
};

export default DifferentialDiagnosisTab;
