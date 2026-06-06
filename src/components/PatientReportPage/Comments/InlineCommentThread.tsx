import React, { useEffect, useState } from "react";
import '../../../pathscribe.css';
import { logEvent } from "../../../audit/auditLogger";

interface Comment {
  id: string;
  author: string;
  text: string;
  resolved: boolean;
}

interface InlineCommentThreadProps {
  questionId:  string;
  templateId:  string;   // passed from parent — no longer hardcoded to DCIS
  currentUser?: string;
}

const COMMENTS_KEY_PREFIX = "ps_comments_";

export const InlineCommentThread: React.FC<InlineCommentThreadProps> = ({
  questionId,
  templateId,
  currentUser = "Dr. Reviewer"
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");

  const storageKey = `${COMMENTS_KEY_PREFIX}${templateId}_${questionId}`;

  // Load comments from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setComments(JSON.parse(raw) as Comment[]);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const persist = (next: Comment[]) => {
    setComments(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  // -----------------------------
  // Add Comment
  // -----------------------------
  const handleAdd = () => {
    const text = draft.trim();
    if (!text) return;

    const newComment: Comment = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      author: currentUser,
      text,
      resolved: false
    };

    const next = [...comments, newComment];
    persist(next);
    setDraft("");

    logEvent({
      user: currentUser,
      category: "user",
      action: "add_comment",
      templateId,
      questionId,
      commentId: newComment.id,
      newValue: text,
      detail: `Added comment: ${text}`,
    });
  };

  // -----------------------------
  // Resolve / Reopen Comment
  // -----------------------------
  const toggleResolved = (id: string) => {
    const next = comments.map(c =>
      c.id === id ? { ...c, resolved: !c.resolved } : c
    );
    persist(next);

    const updated = next.find(c => c.id === id);

    logEvent({
      user: currentUser,
      category: "user",
      action: updated?.resolved ? "resolve_comment" : "reopen_comment",
      templateId,
      questionId,
      commentId: id,
      detail: updated?.resolved ? "Comment resolved" : "Comment reopened",
    });
  };

  // -----------------------------
  // Render
  // -----------------------------

  // If no comments yet, show only the input
  if (!comments.length && !draft) {
    return (
      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Add a comment..."
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") handleAdd();
          }}
          style={{
            width: "100%",
            maxWidth: 360,
            padding: 4,
            fontSize: 12,
            borderRadius: 4,
            border: "1px solid #ddd"
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8, marginBottom: 8 }}>
      {/* Existing Comments */}
      <div style={{ marginBottom: 6 }}>
        {comments.map(c => (
          <div
            key={c.id}
            style={{
              fontSize: 12,
              padding: 6,
              marginBottom: 4,
              borderRadius: 4,
              border: "1px solid #eee",
              background: c.resolved ? "#f3f7f3" : "#f7f7ff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <strong>{c.author}</strong>: {c.text}
              {c.resolved && (
                <span style={{ marginLeft: 8, color: "#3b7a3b" }}>
                  (resolved)
                </span>
              )}
            </div>

            <button
              onClick={() => toggleResolved(c.id)}
              style={{
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 4,
                border: "1px solid #ccc",
                background: "#fff",
                cursor: "pointer"
              }}
            >
              {c.resolved ? "Reopen" : "Resolve"}
            </button>
          </div>
        ))}
      </div>

      {/* Add New Comment */}
      <div>
        <input
          type="text"
          placeholder="Add a comment..."
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") handleAdd();
          }}
          style={{
            width: "100%",
            maxWidth: 360,
            padding: 4,
            fontSize: 12,
            borderRadius: 4,
            border: "1px solid #ddd"
          }}
        />
      </div>
    </div>
  );
};
