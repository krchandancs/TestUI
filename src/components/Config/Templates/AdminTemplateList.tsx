import React from "react";
import '../../../pathscribe.css';
import { useNavigate } from "react-router-dom";

type Template = {
  id: string;
  name: string;
  version: string;
  status: string;
};

const mockTemplates: Template[] = [
  {
    id: "breast_dcis_resection",
    name: "Breast DCIS – Resection",
    version: "4.4.0.0",
    status: "staged",
  },
];

export const AdminTemplateList: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <h1>Template Review Queue</h1>

      {mockTemplates.map((t) => (
        <div
          key={t.id}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginBottom: 12,
            cursor: "pointer",
            borderRadius: 6,
          }}
          onClick={() => navigate(`/template-review/${t.id}`)}
        >
          <div style={{ fontWeight: 600, fontSize: 18 }}>{t.name}</div>
          <div>Version: {t.version}</div>
          <div>Status: {t.status}</div>
        </div>
      ))}
    </div>
  );
};
