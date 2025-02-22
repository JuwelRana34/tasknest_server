require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

// Connect to MongoDB
mongoose.connect(
  `mongodb+srv://${process.env.DB_UserName}:${process.env.DB_Pass}@cluster0.ocbhdf0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
);

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 50 },
  description: { type: String, maxlength: 200 },
  category: {
    type: String,
    enum: ["To-Do", "In Progress", "Done"],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  order: { type: Number, default: 0 },
});
const Task = mongoose.model("Task", TaskSchema);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

//Socket.io connection for realtime updates
io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// API endpoint all tasks
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ order: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).send(err);
  }
});

// API create a new task
app.post("/tasks", async (req, res) => {
  try {
    const { title, description, category, order } = req.body;
    const newTask = new Task({ title, description, category, order });
    await newTask.save();
    io.emit("update", { action: "create", task: newTask });
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).send(err);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
