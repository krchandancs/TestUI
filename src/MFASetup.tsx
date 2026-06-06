import { useState } from "react";

export default function MFASetup() {
  const [secret] = useState("JBSWY3DPEHPK3PXP"); // Example
  const qrUrl = `/api/auth/mfa/qr?secret=${secret}`;

  return (
    <div style={{ maxWidth: "360px", margin: "0 auto", padding: "40px" }}>
      <h2>Set Up Two‑Factor Authentication</h2>

      <p>
        Scan the QR code below using Google Authenticator, Microsoft Authenticator,
        or any TOTP‑compatible app.
      </p>

      <img
        src={qrUrl}
        alt="MFA QR Code"
        style={{
          width: "200px",
          height: "200px",
          margin: "20px auto",
          display: "block"
        }}
      />

      <p style={{ marginTop: "20px" }}>
        Or enter this secret key manually:
      </p>

      <code
        style={{
          display: "block",
          padding: "10px",
          background: "rgba(0,0,0,0.06)",
          borderRadius: "6px",
          fontSize: "16px",
          textAlign: "center"
        }}
      >
        {secret}
      </code>

      <button
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "20px",
          borderRadius: "6px",
          border: "none",
          background: "linear-gradient(135deg, #2563eb, #1e40af)",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer"
        }}
      >
        Continue
      </button>
    </div>
  );
}
