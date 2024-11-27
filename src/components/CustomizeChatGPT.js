import React from "react";

const CustomizeChatGPT = () => {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <webview
          src="https://chat.openai.com"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
        ></webview>
      </div>
    </div>
  );
};

export default CustomizeChatGPT;
