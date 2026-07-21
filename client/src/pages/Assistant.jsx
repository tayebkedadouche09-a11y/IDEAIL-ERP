import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Chip,
  useMediaQuery,
} from "@mui/material";
import { Send as SendIcon, SmartToy as AIIcon, Person as PersonIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseStatCard from "../components/EnterpriseStatCard";

const SUGGESTED_QUESTIONS = [
  "ما هي أفضل المشاريع؟",
  "ما هي المواد الناقصة؟",
  "كم هو الربح هذا الشهر؟",
  "من أفضل العملاء؟",
  "ما هي المشاريع الخاسرة؟",
];

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadHistory() {
    try {
      const res = await api.get("/assistant/history");
      const history = res.data.map((h) => [
        { type: "user", text: h.question, time: h.created_at },
        { type: "ai", text: h.answer, time: h.created_at },
      ]);
      setMessages(history.flat());
    } catch (error) {
      console.log(error);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage = { type: "user", text: input, time: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/assistant/ask", { question: input });
      const aiMessage = { type: "ai", text: res.data.answer, time: new Date().toISOString() };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = { type: "ai", text: "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.", time: new Date().toISOString() };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestedQuestion(question) {
    setInput(question);
    handleSend();
  }

  return (
    <Box>
      <PageHeader
        title="AI Assistant"
        subtitle="المساعد الذكي - اسأل أي سؤال عن إدارة مشاريعك"
        icon="🤖"
      />

      <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 2 }}>
        {/* Chat Interface */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <EnterpriseSection title="AI Assistant Chat" sx={{ flex: 1, mb: 2 }}>
            <Box sx={{ height: 400, overflowY: "auto", mb: 2 }}>
              {messages.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    mb: 2,
                    flexDirection: msg.type === "user" ? "row-reverse" : "row",
                  }}
                >
                  <IconButton
                    sx={{
                      bgcolor: msg.type === "user" ? "primary.main" : "secondary.main",
                      color: "white",
                      mr: msg.type === "user" ? 1 : 0,
                      ml: msg.type === "user" ? 0 : 1,
                    }}
                  >
                    {msg.type === "user" ? <PersonIcon /> : <AIIcon />}
                  </IconButton>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: msg.type === "user" ? "primary.light" : "grey.100",
                      maxWidth: "70%",
                    }}
                  >
                    <Typography>{msg.text}</Typography>
                  </Paper>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                placeholder="اكتب سؤالك هنا..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                disabled={loading}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                sx={{ bgcolor: "primary.main", color: "white" }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </EnterpriseSection>

          {/* Suggested Questions */}
          <EnterpriseSection title="أسئلة مقترحة">
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {SUGGESTED_QUESTIONS.map((q, index) => (
                <Chip
                  key={index}
                  label={q}
                  onClick={() => handleSuggestedQuestion(q)}
                  clickable
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </EnterpriseSection>
        </Box>

        {/* Insight Cards */}
        {!isMobile && (
          <Box sx={{ width: 300 }}>
            <EnterpriseSection title="AI Insights">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <EnterpriseStatCard
                  title="الأرباح"
                  value="0 DZD"
                  color="success"
                  icon="💰"
                />
                <EnterpriseStatCard
                  title="المخزون"
                  value="0 وحدة"
                  color="info"
                  icon="📦"
                />
                <EnterpriseStatCard
                  title="المخاطر"
                  value="0"
                  color="warning"
                  icon="⚠️"
                />
                <EnterpriseStatCard
                  title="التوصيات"
                  value="0"
                  color="secondary"
                  icon="💡"
                />
              </Box>
            </EnterpriseSection>
          </Box>
        )}
      </Box>
    </Box>
  );
}