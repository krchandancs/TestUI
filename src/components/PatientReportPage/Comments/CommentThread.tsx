import React, { useState } from "react";
import '../../pathscribe.css';

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  replies: Comment[];
}

export const CommentThread: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  const currentUser = "Dr. Reviewer"; // mock identity

  const addComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: crypto.randomUUID(),
      author: currentUser,
      text: newComment,
      timestamp: new Date().toLocaleString(),
      replies: []
    };

    setComments(prev => [...prev, comment]);
    setNewComment("");
  };

  const addReply = (parentId: string, replyText: string) => {
    if (!replyText.trim()) return;

    const reply: Comment = {
      id: crypto.randomUUID(),
      author: currentUser,
      text: replyText,
      timestamp: new Date().toLocaleString(),
      replies: []
    };

    const updateThread = (items: Comment[]): Comment[] =>
      items.map(c =>
        c.id === parentId
          ? { ...c, replies: [...c.replies, reply] }
          : { ...c, replies: updateThread(c.replies) }
      );

    setComments(prev => updateThread(prev));
  };

  return (
    <div
      style={{
        marginTop: 40,
        padding: 20,
        border: "1px solid #ddd",
        borderRadius: 8,
        background: "#fafafa"
      }}
    >
      <h3 style={{ marginTop: 0 }}>Reviewer Comments</h3>

      {/* New comment input */}
      <textarea
        value={newComment}
        onChange={e => setNewComment(e.target.value)}
        placeholder="Add a comment..."
        style={{
          width: "100%",
          height: 80,
          padding: 8,
          borderRadius: 4,
          border: "1px solid #ccc",
          marginBottom: 10
        }}
      />

      <button
        onClick={addComment}
        style={{
          padding: "6px 12px",
          background: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer"
        }}
      >
        Post Comment
      </button>

      {/* Render comment thread */}
      <div style={{ marginTop: 20 }}>
        {comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={addReply}
          />
        ))}
      </div>
    </div>
  );
};

interface ItemProps {
  comment: Comment;
  onReply: (parentId: string, text: string) => void;
}

const CommentItem: React.FC<ItemProps> = ({ comment, onReply }) => {
  const [replyText, setReplyText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          padding: 12,
          background: "white",
          border: "1px solid #ddd",
          borderRadius: 6
        }}
      >
        <strong>{comment.author}</strong>
        <div style={{ fontSize: 12, color: "#666" }}>{comment.timestamp}</div>
        <div style={{ marginTop: 6 }}>{comment.text}</div>

        <button
          onClick={() => setShowReplyBox(!showReplyBox)}
          style={{
            marginTop: 8,
            padding: "4px 8px",
            background: "#eee",
            border: "1px solid #ccc",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          Reply
        </button>

        {showReplyBox && (
          <div style={{ marginTop: 10 }}>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              style={{
                width: "100%",
                height: 60,
                padding: 6,
                borderRadius: 4,
                border: "1px solid #ccc"
              }}
            />

            <button
              onClick={() => {
                onReply(comment.id, replyText);
                setReplyText("");
                setShowReplyBox(false);
              }}
              style={{
                marginTop: 6,
                padding: "4px 10px",
                background: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer"
              }}
            >
              Submit Reply
            </button>
          </div>
        )}
      </div>

      {/* Render replies */}
      <div style={{ marginLeft: 30, marginTop: 10 }}>
        {comment.replies.map(r => (
          <CommentItem key={r.id} comment={r} onReply={onReply} />
        ))}
      </div>
    </div>
  );
};
