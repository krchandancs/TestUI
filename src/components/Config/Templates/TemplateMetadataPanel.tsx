import React from "react";
import '../../../pathscribe.css';

interface Props {
  name: string;
  version: string;
  source: string;
  status: string;
  lastUpdated: string;
  reviewedBy: string;
}

export const TemplateMetadataPanel: React.FC<Props> = ({
  name,
  version,
  source,
  status,
  lastUpdated,
  reviewedBy
}) => {
  return (
    <div
      style={{
        background: "#fafafa",
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "16px 20px",
        marginBottom: 24
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>{name}</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div>
          <strong>Source:</strong> {source}
        </div>

        <div>
          <strong>Version:</strong> {version}
        </div>

        <div>
          <strong>Status:</strong>{" "}
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 6,
              background:
                status === "approved"
                  ? "#d4edda"
                  : status === "staged"
                  ? "#fff3cd"
                  : "#e2e3e5",
              color:
                status === "approved"
                  ? "#155724"
                  : status === "staged"
                  ? "#856404"
                  : "#383d41",
              fontWeight: 600
            }}
          >
            {status}
          </span>
        </div>

        <div>
          <strong>Last Updated:</strong> {lastUpdated}
        </div>

        <div>
          <strong>Reviewed By:</strong> {reviewedBy}
        </div>
      </div>
    </div>
  );
};
