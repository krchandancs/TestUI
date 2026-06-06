import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Auth + Providers
import { AuthProvider } from "./contexts/AuthContext";
import { SystemConfigProvider } from "./contexts/SystemConfigContext";
import { SpecimenProvider } from "./contexts/useSpecimens";           // New
import { SubspecialtyProvider } from "./contexts/useSubspecialties"; // New
import { SpecimenDictionaryProvider } from "./components/Config/System/useSpecimenDictionary";

// Core Pages
import Home from "./Home";
import Login from "./Login";
import WorklistPage from "./Worklist/WorklistPage";
import AuditLogPage from "./pages/AuditLogPage";
import ConfigurationPage from "./pages/ConfigurationPage";
import SearchPage from "./pages/SearchPage";

// Reports
import PatientReportPage from "./components/PatientReportPage/PatientReportPage";
const SynopticReportPage = React.lazy(() => import('./pages/SynopticReportPage'))
import FullReportPage from "./pages/FullReportPage";

// Templates (Admin + Pathologist)
import { TemplateRenderer } from "./components/Config/Templates";
import { AdminTemplateList } from "./components/Config/Templates";

// Protocol Editor (Admin)
import ProtocolEditor from "./protocols/ProtocolEditor";

// Contribution Dashboard
import ContributionDashboardPage from "./pages/ContributionDashboardPage";

// Protected Route Wrapper
import ProtectedRoute from "./ProtectedRoute";

const App: React.FC = () => {
  return (
    <Router>
      <SystemConfigProvider>
        <AuthProvider>
          {/* We wrap the app in our new Clinical Data providers */}
          <SpecimenProvider>
            <SubspecialtyProvider>
              <SpecimenDictionaryProvider>
                <Routes>
                  {/* Public Route */}
                  <Route path="/login" element={<Login />} />

                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/worklist" element={<WorklistPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/audit" element={<AuditLogPage />} />
                    <Route path="/configuration" element={<ConfigurationPage />} />
                    <Route path="/contribution" element={<ContributionDashboardPage />} />

                    {/* Clinical Routes */}
                    <Route path="/case/:caseId/synoptic" element={<SynopticReportPage />} />
                    <Route path="/report/:accession" element={<FullReportPage />} />
                    <Route path="/case/:accession" element={<PatientReportPage />} />

                    {/* Admin / Config Routes */}
                    <Route path="/configuration/protocols/:protocolId" element={<ProtocolEditor />} />
                    <Route path="/template-review" element={<AdminTemplateList />} />
                    <Route path="/template-review/:templateId" element={<TemplateRenderer />} />
                  </Route>
                </Routes>
              </SpecimenDictionaryProvider>
            </SubspecialtyProvider>
          </SpecimenProvider>
        </AuthProvider>
      </SystemConfigProvider>
    </Router>
  );
};

export default App;
