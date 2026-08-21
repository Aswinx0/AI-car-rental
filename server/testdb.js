import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected'))
  .catch(e => console.log('Error:', e.message));