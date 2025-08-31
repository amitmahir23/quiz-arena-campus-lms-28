import { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

// Update this to your Render backend URL
const API_BASE_URL = "https://quiz-arena-campus-lms-28.onrender.com";

export const Chatbot = () => {
  const [studentId, setStudentId] = useState("");
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<Array<{ sender: string; text: string }>>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!studentId || !input) return;

    const userMessage = { sender: "You", text: input };
    setChat((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Step 1: Fetch student progress & deadlines
      console.log("Fetching data from:", `${API_BASE_URL}/fetch`);
      const fetchRes = await axios.post(`${API_BASE_URL}/fetch`, {
        student_id: studentId,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout for Render cold starts
      });

      console.log("Fetch response:", fetchRes.data);
      const { progress, deadlines } = fetchRes.data;

      // Step 2: Send full data to chatbot
      console.log("Sending to chatbot:", `${API_BASE_URL}/chat_with_data`);
      const chatRes = await axios.post(`${API_BASE_URL}/chat_with_data`, {
        student_id: studentId,
        message: input,
        progress,
        deadlines,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout for AI processing
      });

      console.log("Chat response:", chatRes.data);
      const botMessage = { sender: "Bot", text: chatRes.data.response };
      setChat((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error("Error in chatbot:", err);
      
      let errorMessage = "⚠️ Error communicating with server";
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage += `: ${err.response.status} - ${err.response.data?.error || err.response.statusText}`;
        console.error("Response error data:", err.response.data);
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage += ": No response received. Server may be starting up (this can take 30-60 seconds on first request).";
        console.error("Request made but no response:", err.request);
      } else if (err.code === 'ECONNABORTED') {
        // Request timeout
        errorMessage += ": Request timed out. The server may be processing your request.";
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage += `: ${err.message}`;
      }
      
      setChat((prev) => [
        ...prev,
        { sender: "Bot", text: errorMessage },
      ]);
      
      if (err.code === 'ECONNABORTED') {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("Failed to connect to the chat server. The server may be starting up - please wait a moment and try again.");
      }
    }

    setInput("");
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && input) {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">🎓 Academic Assistant</h2>
        <Input
          placeholder="Enter your student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <ScrollArea className="flex-1 border rounded-md p-4">
        <div className="flex flex-col gap-2">
          {chat.length === 0 && (
            <div className="text-center text-muted-foreground p-4">
              Enter your student ID and ask a question to get started.
              <div className="mt-2 text-sm">
                <p>Try asking:</p>
                <ul className="list-disc pl-6 mt-1">
                  <li>What's my progress in my courses?</li>
                  <li>Do I have any upcoming deadlines?</li>
                  <li>When is my next assignment due?</li>
                  <li>How am I performing compared to my classmates?</li>
                  <li>What should I focus on studying next?</li>
                </ul>
              </div>
            </div>
          )}
          {chat.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${
                msg.sender === "You"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted"
              } max-w-[80%]`}
            >
              <p className="text-sm font-semibold mb-1">{msg.sender}</p>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          ))}
          {loading && (
            <div className="bg-muted p-3 rounded-lg max-w-[80%]">
              <p className="text-sm font-semibold mb-1">Bot</p>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing your academic data...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={studentId ? "Ask something..." : "Enter student ID first"}
          disabled={!studentId || loading}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={loading || !input || !studentId}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Thinking...
            </>
          ) : (
            "Send"
          )}
        </Button>
      </div>
    </div>
  );
};