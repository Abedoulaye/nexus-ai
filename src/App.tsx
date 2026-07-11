import { useState, useEffect } from "react";

interface Message {
  role: string;
  content: string;
}

interface Chat {
  id: number;
  title: string;
  messages: Message[];
}

function App() {
  const [chatHistory, setChatHistory] = useState<Chat[]>(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved
      ? JSON.parse(saved)
      : [{ id: 1, title: "First Chat", messages: [] }];
  });

  const [message, setMessage] = useState<string>("");
  const [activeChatId, setActiveChatId] = useState(1);

  const activeChat = chatHistory.find((chat) => chat.id === activeChatId);
  const messages = activeChat ? activeChat.messages : [];

  async function sendMessageToNexus(messages: Message[]) {
    const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

    if (!API_KEY) {
      console.error("Groq API key is missing!");
      return " currently unavailable.";
    }

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            messages: messages,
            model: "llama-3.1-8b-instant",
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Error! Status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { role: "assistant", content: assistantMessage },
                ],
              }
            : chat,
        ),
      );
    } catch (error) {
      console.error("Error sending message to Nexus:", error);
    }
  }

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  return (
    <div className="grid grid-cols-[1fr_5fr] h-screen w-full overflow-hidden">
      <aside className="bg-[#111827] border-r border-gray-800 flex flex-col overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-800">
          <h1 className="text-lg font-semibold text-white tracking-tight">
            Nexus
          </h1>
        </div>

        <div className="px-3 py-3">
          <button
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-700 text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors"
            onClick={() =>
              setChatHistory([
                ...chatHistory,
                {
                  id: Date.now(),
                  title: ` Chat ${chatHistory.length + 1}`,
                  messages: [],
                },
              ])
            }
          >
            <span className="text-lg leading-none">+</span>
            New Chat
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {chatHistory.map((chat, i) => (
            <a
              key={i}
              href="#"
              onClick={() => setActiveChatId(chat.id)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                chat.id === activeChatId
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
              }`}
            >
              {chat.title}
            </a>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
              Y
            </div>
            <span className="text-sm text-gray-300 truncate">You</span>
          </div>
        </div>
      </aside>

      <main className="bg-[#1a1a2e] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              N
            </div>
            <div className="max-w-2xl">
              <p className="text-sm text-gray-300 leading-relaxed">
                Hello! I'm Nexus, your AI assistant. How can I help you today?
              </p>
            </div>
          </div>

          {messages.map((msg, i) =>
            msg.role === "user" ? (
              <div key={i} className="flex gap-4 justify-end">
                <div className="max-w-2xl">
                  <div className="bg-indigo-600 text-white rounded-2xl rounded-br-md px-4 py-3">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  Y
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  N
                </div>
                <div className="max-w-2xl space-y-3">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>

        <div className="border-t border-gray-800 px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 bg-[#111827] border border-gray-700 rounded-2xl px-5 py-3 focus-within:border-indigo-500 transition-colors">
              <input
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-200 placeholder-gray-500"
                type="text"
                placeholder="Message Nexus..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && message.trim()) {
                    setChatHistory((prev) =>
                      prev.map((chat) =>
                        chat.id === activeChatId
                          ? {
                              ...chat,
                              messages: [
                                ...chat.messages,
                                { role: "user", content: message },
                              ],
                            }
                          : chat,
                      ),
                    );
                    setMessage("");
                    sendMessageToNexus([
                      ...messages,
                      { role: "user", content: message },
                    ]);
                  }
                }}
              />
              <button
                className="w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center transition-colors flex-shrink-0"
                onClick={() => {
                  if (message.trim()) {
                    setChatHistory((prev) =>
                      prev.map((chat) =>
                        chat.id === activeChatId
                          ? {
                              ...chat,
                              messages: [
                                ...chat.messages,
                                { role: "user", content: message },
                              ],
                            }
                          : chat,
                      ),
                    );
                    setMessage("");
                    sendMessageToNexus([
                      ...messages,
                      { role: "user", content: message },
                    ]);
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M1 8L15 1L8 15L6 9L1 8Z"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-600 text-center mt-3">
              Nexus can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
