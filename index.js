const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { ObjectId } = require("mongodb");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Mongoose Schema and Model
const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  priority: String,
  isCompleted: Boolean,
});

const Task = mongoose.model("Task", taskSchema);

// Routes
app.get("/tasks", async (req, res) => {
  try {
    let query = {};
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    const tasks = await Task.find(query);
    res.send({ status: true, data: tasks });
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
});

app.post("/task", async (req, res) => {
  try {
    const task = new Task(req.body);
    const result = await task.save();
    res.send(result);
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
});

app.get("/task/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const task = await Task.findById(ObjectId(id));
    res.send(task);
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
});

app.delete("/task/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Task.deleteOne({ _id: ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
});

app.put("/task/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const task = req.body;

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .send({ status: false, error: "Invalid ID format" });
    }

    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        isCompleted: task.isCompleted,
        title: task.title,
        description: task.description,
        priority: task.priority,
      },
    };

    const options = { upsert: false }; // Use upsert: false to avoid creating new documents if not found
    const result = await Task.updateOne(filter, updateDoc, options);

    if (result.matchedCount === 0) {
      return res.status(404).send({ status: false, error: "Task not found" });
    }

    res.json({ status: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: false, error: err.message });
  }
});

// Basic route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
