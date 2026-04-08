import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BuyerLayout from "../Buyer/BuyerLayout";
import PhotographerLayout from "../Photographer/PhotographerLayout";
import ConversationList from "./ConversationList";
import ChatUI from "./ChatUI";
import {
  getConversations,
  getConversationWithUser,
  markConversationAsRead,
} from "../../../api/API";
import "./Messaging.css";

const MessagingPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncKey, setSyncKey] = useState(0); // Trigger re-fetch
  const [pendingUserId, setPendingUserId] = useState(null);
  const [pendingConversationId, setPendingConversationId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id || user._id;
  const userRole = String(localStorage.getItem("role") || "").toLowerCase();
  const Layout = userRole.includes("photographer") ? PhotographerLayout : BuyerLayout;

  // Redirect if not authenticated
  useEffect(() => {
    if (!token || !userId) {
      navigate("/login");
    }
  }, [token, userId, navigate]);

  // Read route state / query params for direct conversation start
  useEffect(() => {
    const routeUserId = location.state?.selectedUserId;
    const urlSearch = new URLSearchParams(location.search);
    const routeConversationId = urlSearch.get("conversation");

    if (routeUserId) {
      setPendingUserId(routeUserId);
    }

    if (routeConversationId) {
      setPendingConversationId(routeConversationId);
    }
  }, [location.state, location.search]);

  useEffect(() => {
    if (!pendingUserId || !userId) return;

    const openConversation = async () => {
      try {
        const response = await getConversationWithUser(pendingUserId);
        if (response?.data) {
          setSelectedConversation(response.data);
        }
      } catch (err) {
        console.error("Failed to open conversation from route state:", err);
      } finally {
        setPendingUserId(null);
      }
    };

    openConversation();
  }, [pendingUserId, userId]);

  // Fetch all conversations
  useEffect(() => {
    if (!userId) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getConversations(50, 0);
        setConversations(response.data || []);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
        setError(err.response?.data?.message || "Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [userId, syncKey]);

  // Handle conversation selection
  const handleSelectConversation = useCallback(async (conversation) => {
    setSelectedConversation(conversation);
    // Mark as read when selected
    try {
      await markConversationAsRead(conversation._id);
      // Update conversation in list
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversation._id
            ? { ...conv, unreadCounts: { ...conv.unreadCounts, [userId]: 0 } }
            : conv
        )
      );
    } catch (err) {
      console.error("Failed to mark conversation as read:", err);
    }
  }, [userId]);

  useEffect(() => {
    if (!pendingConversationId || conversations.length === 0) return;

    const selected = conversations.find((conv) => conv._id === pendingConversationId);
    if (selected) {
      handleSelectConversation(selected);
      setPendingConversationId(null);
    }
  }, [pendingConversationId, conversations, handleSelectConversation]);

  // Handle new message sent - refresh conversations
  const handleMessageSent = () => {
    setSyncKey((prev) => prev + 1);
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    const participantName =
      conv.participants
        ?.find((p) => p._id !== userId)
        ?.username || "Unknown";
    return participantName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Layout>
      <div className="messaging-container">
        <div className="messaging-wrapper">
          {/* Conversation List Sidebar */}
          <div className="messaging-sidebar">
            <div className="sidebar-header">
              <h2 className="fs-4 fw-bold text-white mb-3">Messages</h2>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "white",
                }}
              />
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger alert-sm mb-3">{error}</div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <p className="small">No conversations yet</p>
              </div>
            ) : (
              <ConversationList
                conversations={filteredConversations}
                selectedConversationId={selectedConversation?._id}
                onSelectConversation={handleSelectConversation}
                currentUserId={userId}
              />
            )}
          </div>

          {/* Chat Window */}
          <div className="messaging-main">
            {selectedConversation ? (
              <ChatUI
                conversation={selectedConversation}
                onMessageSent={handleMessageSent}
                currentUserId={userId}
              />
            ) : (
              <div className="chat-empty">
                <div className="text-center">
                  <i className="fas fa-comments text-muted" style={{ fontSize: "3rem" }}></i>
                  <p className="text-muted mt-3">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MessagingPage;
