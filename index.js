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
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 50 },
  photo: { type: String, },
  email: { type: String, required: true, unique: true, },
  timestamp: { type: Date, default: Date.now },

});
const Task = mongoose.model("Task", TaskSchema);
const User = mongoose.model("User", UserSchema);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

//Socket.io connection for realtime updates
io.on("connection", (socket) => {

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});



// user api
app.post("/user", async (req, res) => {
  const userinfo = req.body;
  console.log(userinfo);
  const user = await User.findOne({ email: userinfo.email });
  if (user) {
    return res.send({ message: "User already exists" });
  }
  const response = await User.create({
    ...userinfo,
    createdAt: new Date(),
  });
  res.send(response);
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

// update a task (e.g., when moving between columns)
app.put("/tasks/:id", async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    io.emit("update", { action: "update", task: updatedTask });
    res.json(updatedTask);
  } catch (err) {
    res.status(500).send(err);
  }
});

//delete a task
app.delete("/tasks/:id", async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    io.emit("update", { action: "delete", task: deletedTask });
    res.json(deletedTask);
  } catch (err) {
    res.status(500).send(err);
  }
});



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
