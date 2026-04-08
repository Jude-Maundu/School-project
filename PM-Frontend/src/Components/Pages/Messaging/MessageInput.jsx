import React, { useState } from "react";
import { sendMessage } from "../../../api/API";
import "./MessageInput.css";

const MessageInput = ({
  conversationId,
  onMessageSent,
  replyingTo,
  onCancelReply,
}) => {
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) {
      return;
    }

    try {
      setSending(true);
      setError(null);

      const response = await sendMessage(
        conversationId,
        messageText.trim(),
        replyingTo?._id || null
      );

      setMessageText("");
      onMessageSent(response.data);
      onCancelReply?.();
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="message-input-container">
      {/* Reply preview */}
      {replyingTo && (
        <div className="reply-preview">
          <div className="reply-label">
            <small>Replying to {replyingTo.sender?.username || "unknown"}:</small>
          </div>
          <div className="reply-content">
            <small>{replyingTo.text}</small>
          </div>
          <button
            className="btn-cancel-reply"
            onClick={onCancelReply}
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Error message */}
      {error && <div className="alert alert-danger alert-sm mb-2">{error}</div>}

      {/* Message input form */}
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={sending}
            maxLength={500}
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={sending || !messageText.trim()}
          >
            {sending ? (
              <span className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Sending...</span>
              </span>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                <span className="d-none d-sm-inline ms-2">Send</span>
              </>
            )}
          </button>
        </div>
        <small className="text-muted">
          {messageText.length}/500
        </small>
      </form>
    </div>
  );
};

export default MessageInput;
