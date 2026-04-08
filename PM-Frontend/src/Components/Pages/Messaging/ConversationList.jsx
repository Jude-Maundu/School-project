import React from "react";
import { formatDistanceToNow } from "date-fns";
import "./ConversationList.css";

const ConversationList = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentUserId,
}) => {
  const getParticipantName = (conversation) => {
    const otherParticipant = conversation.participants?.find(
      (p) => p._id !== currentUserId
    );
    return otherParticipant?.username || "Unknown User";
  };

  const getUnreadCount = (conversation) => {
    return conversation.unreadCounts?.[currentUserId] || 0;
  };

  return (
    <div className="conversation-list">
      {conversations.map((conversation) => {
        const participantName = getParticipantName(conversation);
        const unreadCount = getUnreadCount(conversation);
        const isSelected = selectedConversationId === conversation._id;
        const lastMessagePreview = conversation.lastMessageText?.substring(0, 50) || "No messages yet";
        const lastMessageTime = conversation.lastMessageAt
          ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })
          : "Never";

        return (
          <div
            key={conversation._id}
            className={`conversation-item ${isSelected ? "active" : ""} ${
              unreadCount > 0 ? "unread" : ""
            }`}
            onClick={() => onSelectConversation(conversation)}
            role="button"
            tabIndex={0}
          >
            <div className="conversation-item-avatar">
              <div className="avatar-placeholder">
                {participantName.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="conversation-item-content">
              <div className="conversation-item-header">
                <h6 className="conversation-item-name">{participantName}</h6>
                <span className="conversation-item-time">{lastMessageTime}</span>
              </div>
              <p className="conversation-item-preview">{lastMessagePreview}</p>
            </div>

            {unreadCount > 0 && (
              <div className="unread-badge">{unreadCount}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
