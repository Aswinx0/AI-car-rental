import Car from "./models/Car.js";
import mongoose from "mongoose";
import { CohereEmbeddings } from "@langchain/cohere";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { ChatGroq } from "@langchain/groq";
import { Document } from "@langchain/core/documents";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VECTOR_STORE_PATH = path.join(__dirname, "vectorstore");

let vectorStore = null;
let initPromise = null;

function carToDocument(car) {
  const content = `
Brand: ${car.brand}
Model: ${car.model}
Year: ${car.year}
Category: ${car.category}
Seating Capacity: ${car.seating_capacity} people
Fuel Type: ${car.fuel_type}
Transmission: ${car.transmission}
Price: ₹${car.pricePerDay} per day
Location: ${car.location}
Description: ${car.description}
Car ID: ${car._id}
  `.trim();

  return new Document({
    pageContent: content,
    metadata: {
      carId: car._id.toString(),
      brand: car.brand,
      model: car.model,
      pricePerDay: car.pricePerDay,
      seating_capacity: car.seating_capacity,
      location: car.location,
    },
  });
}

function getEmbeddings() {
  return new CohereEmbeddings({
    apiKey: process.env.COHERE_API_KEY,
    model: "embed-english-v3.0",
  });
}

export async function initializeVectorStore() {
  if (vectorStore) return vectorStore;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB is not connected. Fix your database connection first.");
    }

    const embeddings = getEmbeddings();
    const indexPath = path.join(VECTOR_STORE_PATH, "faiss.index");

    if (fs.existsSync(indexPath)) {
      vectorStore = await FaissStore.load(VECTOR_STORE_PATH, embeddings);
      console.log("Chatbot: loaded FAISS vector store from disk");
      return vectorStore;
    }

    const cars = await Car.find({ isAvaliable: true });

    if (cars.length === 0) {
      console.warn("Chatbot: no available cars found, using placeholder index");
      vectorStore = await FaissStore.fromDocuments(
        [
          new Document({
            pageContent: "No cars are currently available in the rental fleet.",
            metadata: {},
          }),
        ],
        embeddings
      );
    } else {
      const documents = cars.map(carToDocument);
      vectorStore = await FaissStore.fromDocuments(documents, embeddings);
      console.log(`Chatbot: built FAISS index with ${cars.length} cars`);
    }

    fs.mkdirSync(VECTOR_STORE_PATH, { recursive: true });
    await vectorStore.save(VECTOR_STORE_PATH);
    return vectorStore;
  })();

  return initPromise;
}

export async function rebuildVectorStore() {
  vectorStore = null;
  initPromise = null;

  if (fs.existsSync(VECTOR_STORE_PATH)) {
    fs.rmSync(VECTOR_STORE_PATH, { recursive: true, force: true });
  }

  return initializeVectorStore();
}

export async function askChatbot(question) {
  const trimmedQuestion = question?.trim();
  if (!trimmedQuestion) {
    throw new Error("Question is required");
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const store = await initializeVectorStore();
  const relevantDocs = await store.similaritySearch(trimmedQuestion, 4);
  const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n---\n\n");

  const llm = new ChatGroq({
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    temperature: 0.3,
    apiKey: process.env.GROQ_API_KEY,
  });

  const response = await llm.invoke([
    new SystemMessage(
      `You are a helpful car rental assistant for an Indian car rental platform.
Use ONLY the car data provided in the context to answer questions.
If no suitable cars match, say so politely and suggest adjusting budget, passenger count, or location.
Prices are in INR (₹). Be concise and recommend specific cars with brand, model, price per day, seating, and why they fit.`
    ),
    new HumanMessage(
      `Context (available cars):\n${context}\n\nUser question: ${trimmedQuestion}`
    ),
  ]);

  return {
    answer: response.content,
    sources: relevantDocs.map((doc) => doc.metadata),
  };
}
