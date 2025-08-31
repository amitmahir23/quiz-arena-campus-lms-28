//src/components/chatroom/ChatRoom.tsx
import { useEffect, useState, useRef } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

export default function ChatRoom({ roomId, currentUser, profile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const messagesRef = collection(db, "rooms", roomId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messagesRef = collection(db, "rooms", roomId, "messages");
    await addDoc(messagesRef, {
      text: input,
      uid: currentUser.id,
      userName: profile?.full_name || currentUser.email,
      createdAt: serverTimestamp(),
    });

    setInput("");
  };

  return (
    <div className="flex flex-col h-[80vh] border rounded-lg shadow-md">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded-lg max-w-xs ${
              msg.uid === currentUser.id
                ? "bg-purple-500 text-white ml-auto"
                : "bg-gray-200 text-gray-900"
            }`}
          >
            <div className="text-sm font-semibold">{msg.userName}</div>
            <div>{msg.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-2 border-t flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          type="submit"
          className="bg-purple-500 text-white px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </form>
    </div>
  );
}
