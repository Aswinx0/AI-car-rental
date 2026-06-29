import express from "express";
import { askChatbot, rebuildVectorStore } from "../chatbot.js";

const chatbotRouter = express.Router();

chatbotRouter.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question?.trim()) {
      return res.json({ success: false, message: "Question is required" });
    }

    const result = await askChatbot(question);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Chatbot error:", error.message);
    res.json({ success: false, message: error.message });
  }
});

chatbotRouter.post("/rebuild-index", async (req, res) => {
  try {
    await rebuildVectorStore();
    res.json({ success: true, message: "Vector index rebuilt from latest car data" });
  } catch (error) {
    console.error("Rebuild index error:", error.message);
    res.json({ success: false, message: error.message });
  }
});

export default chatbotRouter;
