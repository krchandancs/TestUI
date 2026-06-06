import type React from "react";

// Overlay behind the modal
export const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

// Main modal container
export const modalBox: React.CSSProperties = {
  backgroundColor: "#111827", // dark neutral
  borderRadius: 8,
  border: "1px solid #1f2933",
  maxHeight: "95vh",
  width: 520,
  maxWidth: "90vw",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  display: "flex",
  flexDirection: "column",
  gap: 16,
  boxShadow: "0 18px 45px rgba(0, 0, 0, 0.7)",
};

// Header/title
export const modalHeaderStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "#e5e7eb",
  marginBottom: 4,
};

// Optional subheader / helper text
export const modalSubheaderStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#9ca3af",
  marginBottom: 4,
};

// Wrapper for each field (label + control)
export const fieldGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  marginBottom: 12,
};

// Label
export const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#9ca3af",
  marginBottom: 4,
  display: "block",
};

// Shared base control style
const baseControl: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #374151",
  backgroundColor: "#020617",
  color: "#e5e7eb",
  fontSize: 14,
  outline: "none",
};

// Text input
export const inputStyle: React.CSSProperties = {
  ...baseControl,
};

// Textarea
export const textareaStyle: React.CSSProperties = {
  ...baseControl,
  minHeight: 90,
  resize: "vertical",
};

// Select
export const selectStyle: React.CSSProperties = {
  ...baseControl,
  appearance: "none",
};

// Footer (buttons row)
export const modalFooterStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 8,
};

// Cancel button
export const cancelButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "1px solid #4b5563",
  backgroundColor: "#111827",
  color: "#e5e7eb",
  fontSize: 14,
  cursor: "pointer",
};

// Primary / apply button
export const applyButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "none",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};
