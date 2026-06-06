import React, { useState } from "react";
import '../../../pathscribe.css';

export const TemplateReviewActions: React.FC = () => {
  const [status, setStatus] = useState<"pending" | "approved" | "changes" | "rejected">("pending");
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState("");

  const handleApprove = () => {
    setStatus("approved");
  };

  const handleNeedsChanges = () => {
    setStatus("changes");
    setShowModal(true);
  };

  const handleReject = () => {
    setStatus("rejected");
    setShowModal(true);
  };

  const submitComment = () => {
    console.log("Submitted comment:", comment);
    setShowModal(false);
    setComment("");
  };

  return (
    <div style={{
      padding: "12px 16px",
      background: "#f8f8f8",
      borderBottom: "1px solid #ddd",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 10
    }}>
      
      {/* Status Badge */}
      <div style={{
        padding: "4px 10px",
        borderRadius: 6,
        background:
          status === "approved" ? "#d4edda" :
          status === "changes" ? "#fff3cd" :
          status === "rejected" ? "#f8d7da" :
          "#e2e3e5",
        color:
          status === "approved" ? "#155724" :
          status === "changes" ? "#856404" :
          status === "rejected" ? "#721c24" :
          "#383d41",
        fontWeight: 600
      }}>
        {status === "pending" && "Pending Review"}
        {status === "approved" && "Approved"}
        {status === "changes" && "Needs Changes"}
        {status === "rejected" && "Rejected"}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={handleApprove}
          style={{
            padding: "6px 12px",
            background: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          Approve
        </button>

        <button
          onClick={handleNeedsChanges}
          style={{
            padding: "6px 12px",
            background: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          Needs Changes
        </button>

        <button
          onClick={handleReject}
          style={{
            padding: "6px 12px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          Reject
        </button>
      </div>

      {/* Comment Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20
        }}>
          <div style={{
            background: "white",
            padding: 20,
            borderRadius: 8,
            width: 400
          }}>
            <h3>Reviewer Comment</h3>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              style={{
                width: "100%",
                height: 100,
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc"
              }}
            />
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button
                onClick={submitComment}
                style={{
                  padding: "6px 12px",
                  background: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer"
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
