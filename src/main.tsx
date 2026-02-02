import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { useChatStore } from "./stores/chatStore";

// Listen for storage changes from other tabs to keep state in sync
window.addEventListener('storage', (event) => {
  if (event.key === 'roblox-chat-storage') {
    useChatStore.getState().syncFromStorage();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
