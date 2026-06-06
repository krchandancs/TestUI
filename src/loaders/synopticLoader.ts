import { LoaderFunctionArgs, redirect } from "react-router-dom";
import { mockCaseService } from "../services/cases/mockCaseService";
import { mockOrchestratorCaseService } from "../services/cases/mockOrchestratorCaseService";

export async function synopticLoader({ params }: LoaderFunctionArgs) {
  const caseId = params.caseId;

  if (!caseId) {
    console.error("Missing caseId in route params");
    return redirect("/worklist");
  }

  // Try LIS service first (S26- cases), then Orchestrator service (O26- cases)
  let caseData = await mockCaseService.getCase(caseId).catch(() => null);

  if (!caseData) {
    caseData = await mockOrchestratorCaseService.getCase(caseId).catch(() => null) ?? undefined;
  }

  if (!caseData) {
    console.error(`Case not found in any service: ${caseId}`);
    return redirect("/worklist");
  }

  return caseData;
}
