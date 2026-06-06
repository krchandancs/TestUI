import { useState } from "react";

export default function MFA() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");

  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      const next = document.getElementById(`mfa-${index + 1}`);
      next?.focus();
    }
  };

  const handleVerify = () => {
    const joined = code.join("");
    if (joined.length !== 6) {
      setError("Please enter the full 6‑digit code.");
      return;
    }
    // Call backend: POST /auth/mfa/verify
  };

  return (
    <div style={{ maxWidth: "360px", margin: "0 auto", padding: "40px" }}>
      <h2>Two‑Factor Authentication</h2>
      <p>Enter the 6‑digit code from your authenticator app.</p>

      <div style={{ display: "flex", gap: "8px", margin: "20px 0" }}>
        {code.map((digit, i) => (
          <input
            key={i}
            id={`mfa-${i}`}
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            maxLength={1}
            style={{
              width: "42px",
              height: "48px",
              textAlign: "center",
              fontSize: "22px",
              borderRadius: "6px",
              border: "1px solid rgba(0,0,0,0.25)"
            }}
          />
        ))}
      </div>

      {error && (
        <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>
      )}

      <button
        onClick={handleVerify}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "6px",
          border: "none",
          background: "linear-gradient(135deg, #2563eb, #1e40af)",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer"
        }}
      >
        Verify Code
      </button>

      <div style={{ marginTop: "16px", fontSize: "14px" }}>
        <p style={{ marginBottom: "4px" }}>Didn’t receive a code?</p>
        <a href="#">Resend Code</a> | <a href="#">Use Backup Code</a>
      </div>

      <p style={{ marginTop: "20px", opacity: 0.7, fontSize: "13px" }}>
        Tip: Lost your device? Contact your IT administrator to reset MFA using your backup codes.
      </p>

      <a href="/">← Back to login</a>
    </div>
  );
}
