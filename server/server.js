import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import chatbotRouter from "./routes/chatbot.js";
import { initializeVectorStore } from "./chatbot.js";

// Initialize Express App
const app = express()

// Connect Database
await connectDB()

// Build FAISS index in background (first run downloads the embedding model)
initializeVectorStore().catch((error) => {
  console.error("Chatbot vector store init failed:", error.message)
  console.error("Server will still run — chatbot will retry on first question.")
})

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res)=> res.send("Server is running"))
app.use('/api/user', userRouter)
app.use('/api/owner', ownerRouter)
app.use('/api/bookings', bookingRouter)
app.use('/api/chatbot', chatbotRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`))