import React, { useEffect } from "react";
import '../../pathscribe.css';
import { useParams, useNavigate } from "react-router-dom";
import { getMockReport } from "../../mock/mockReports";
import { VoiceCommandOverlay } from "../../components/Voice/VoiceCommandOverlay";
import { VoiceMissPrompt }     from "../../components/Voice/VoiceMissPrompt";
import { mockActionRegistryService } from "../../services/actionRegistry/mockActionRegistryService";
import { VOICE_CONTEXT } from "../../constants/systemActions";

const PatientReportPage: React.FC = () => {
  const { accession } = useParams();
  const navigate = useNavigate();

  // ── Voice: CASE_VIEW context — outside AppShell so mounts overlays directly
  useEffect(() => {
    mockActionRegistryService.setCurrentContext(VOICE_CONTEXT.CASE_VIEW);
    return () => mockActionRegistryService.setCurrentContext(VOICE_CONTEXT.WORKLIST);
  }, []);

  useEffect(() => {
    const goBack   = () => navigate(-1);
    const goForward= () => navigate(1);
    const nextCase = () => navigate(1);
    const prevCase = () => navigate(-1);

    window.addEventListener('PATHSCRIBE_GO_BACK',           goBack);
    window.addEventListener('PATHSCRIBE_GO_FORWARD',        goForward);
    window.addEventListener('PATHSCRIBE_NAV_NEXT_CASE',     nextCase);
    window.addEventListener('PATHSCRIBE_NAV_PREVIOUS_CASE', prevCase);

    return () => {
      window.removeEventListener('PATHSCRIBE_GO_BACK',           goBack);
      window.removeEventListener('PATHSCRIBE_GO_FORWARD',        goForward);
      window.removeEventListener('PATHSCRIBE_NAV_NEXT_CASE',     nextCase);
      window.removeEventListener('PATHSCRIBE_NAV_PREVIOUS_CASE', prevCase);
    };
  }, [navigate]);

  if (!accession) {
    return <div style={{ color: "white" }}>Invalid report ID.</div>;
  }

  const report = getMockReport(accession);

  if (!report) {
    return <div style={{ color: "white" }}>No report found.</div>;
  }

  return (
    <>
      <div style={{ padding: "2rem", color: "white" }}>
        <h1 data-phi="accession">{report.accession}</h1>
        <p data-phi="diagnosis">{report.diagnosis}</p>
        <p>Last Updated: {report.lastUpdated}</p>
      </div>

      {/* Voice overlays — outside AppShell so mounted directly here */}
      <VoiceCommandOverlay showSuccess={import.meta.env.DEV} />
      <VoiceMissPrompt />
    </>
  );
};

export default PatientReportPage;
