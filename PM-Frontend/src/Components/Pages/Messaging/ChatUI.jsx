import React, { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { getMessages, deleteMessage, editMessage, addReaction } from "../../../api/API";
import MessageInput from "./MessageInput";
import ReactionPicker from "./ReactionPicker";
import "./ChatUI.css";

const ChatUI = ({ conversation, onMessageSent, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch messages for conversation
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getMessages(conversation._id, 50, 0);
        setMessages(response.data || []);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setError(err.response?.data?.message || "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversation._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle message sent
  const handleMessageSent = (newMessage) => {
    setMessages((prev) => [...prev, newMessage]);
    setReplyingToMessage(null);
    onMessageSent();
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;

    try {
      await deleteMessage(messageId, false); // Soft delete
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (err) {
      console.error("Failed to delete message:", err);
      alert(err.response?.data?.message || "Failed to delete message");
    }
  };

  // Handle edit message
  const handleEditMessage = async (messageId, newText) => {
    try {
      await editMessage(messageId, newText);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, text: newText, editHistory: [...(msg.editHistory || []), msg.text] }
            : msg
        )
      );
      setEditingMessageId(null);
    } catch (err) {
      console.error("Failed to edit message:", err);
      alert(err.response?.data?.message || "Failed to edit message");
    }
  };

  // Handle add emoji reaction
  const handleAddReaction = async (messageId, emoji) => {
    try {
      await addReaction(messageId, emoji);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId) {
            const reactions = new Map(msg.reactions || []);
            const currentReaction = reactions.get(emoji) || [];
            reactions.set(emoji, [...currentReaction, currentUserId]);
            return { ...msg, reactions };
          }
          return msg;
        })
      );
      setShowReactionPicker(null);
    } catch (err) {
      console.error("Failed to add reaction:", err);
    }
  };

  const getParticipantName = () => {
    const otherParticipant = conversation.participants?.find(
      (p) => p._id !== currentUserId
    );
    return otherParticipant?.username || "Unknown User";
  };

  return (
    <div className="chat-ui">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-avatar">
          <div className="avatar-small">
            {getParticipantName().charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="chat-header-info">
          <h5 className="mb-0">{getParticipantName()}</h5>
          <small className="text-muted">Active now</small>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => {
              const isSender = message.sender?._id === currentUserId;
              const messageTime = formatDistanceToNow(
                new Date(message.createdAt),
                { addSuffix: true }
              );

              return (
                <div
                  key={message._id}
                  className={`message-group ${isSender ? "sent" : "received"}`}
                >
                  {/* Reply target (if replying to something) */}
                  {message.replyTo && (
                    <div className="message-reply-target">
                      <small>Replying to:</small>
                      <div className="reply-text">
                        {typeof message.replyTo === "string"
                          ? message.replyTo
                          : message.replyTo.text}
                      </div>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className="message-bubble">
                    {editingMessageId === message._id ? (
                      <div className="message-edit-form">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          defaultValue={message.text}
                          onBlur={(e) => {
                            const newText = e.target.value.trim();
                            if (newText && newText !== message.text) {
                              handleEditMessage(message._id, newText);
                            } else {
                              setEditingMessageId(null);
                            }
                          }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <p className="message-text">{message.text}</p>
                    )}

                    {/* Message metadata */}
                    <div className="message-meta">
                      <small>{messageTime}</small>
                      {message.editHistory && message.editHistory.length > 0 && (
                        <small className="text-muted ms-2">(edited)</small>
                      )}
                    </div>

                    {/* Message actions (only for sender) */}
                    {isSender && (
                      <div className="message-actions">
                        <button
                          className="btn-action"
                          title="Edit"
                          onClick={() => setEditingMessageId(message._id)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn-action"
                          title="Delete"
                          onClick={() => handleDeleteMessage(message._id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}

                    {/* Reaction picker trigger */}
                    <button
                      className="btn-add-reaction"
                      onClick={() =>
                        setShowReactionPicker(
                          showReactionPicker === message._id ? null : message._id
                        )
                      }
                    >
                      <i className="far fa-smile"></i>
                    </button>

                    {/* Reactions display */}
                    {message.reactions && message.reactions.size > 0 && (
                      <div className="message-reactions">
                        {Array.from(message.reactions.entries()).map(([emoji, users]) => (
                          <span key={emoji} className="reaction-chip" title={users.join(", ")}>
                            {emoji} {users.length}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Reaction picker dropdown */}
                    {showReactionPicker === message._id && (
                      <ReactionPicker
                        onSelectReaction={(emoji) =>
                          handleAddReaction(message._id, emoji)
                        }
                        onClose={() => setShowReactionPicker(null)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        conversationId={conversation._id}
        onMessageSent={handleMessageSent}
        replyingTo={replyingToMessage}
        onCancelReply={() => setReplyingToMessage(null)}
      />
    </div>
  );
};

export default ChatUI;
