import React from "react";
import "./ReactionPicker.css";

const ReactionPicker = ({ onSelectReaction, onClose }) => {
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "😡", "🔥", "✨"];

  return (
    <div className="reaction-picker">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          className="reaction-option"
          onClick={() => onSelectReaction(emoji)}
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default ReactionPicker;
