// Home.jsx
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import io from "socket.io-client";
import axios from "axios";
import { toast } from "sonner";

const socket = io(`${import.meta.env.VITE_API}`);

const initialColumns = {
  "To-Do": [],
  "In Progress": [],
  Done: [],
};

const Home = () => {
  const [columns, setColumns] = useState(initialColumns);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "To-Do",
  });
  const [editingTask, setEditingTask] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Fetch tasks and distribute them into columns
  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API}/tasks`);
      const newColumns = { "To-Do": [], "In Progress": [], Done: [] };
      res.data.forEach((task) => {
        newColumns[task.category].push(task);
      });
      setColumns(newColumns);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
    socket.on("update", () => {
      fetchTasks();
    });
    return () => socket.off("update");
  }, []);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    // Prevent moving directly from 'To-Do' to 'Done'
    if (source.droppableId === "To-Do" && destination.droppableId === "Done") {
      toast.error("Please move the task to 'In Progress' before marking it as done.");
      return;
    }

    // Reordering within the same column
    if (source.droppableId === destination.droppableId) {
      const updatedTasks = Array.from(columns[source.droppableId]);
      const [movedTask] = updatedTasks.splice(source.index, 1);
      updatedTasks.splice(destination.index, 0, movedTask);

      const tasksToUpdate = updatedTasks.map((task, index) => ({
        ...task,
        order: index,
      }));

      setColumns({
        ...columns,
        [source.droppableId]: tasksToUpdate,
      });

      try {
        await Promise.all(
          tasksToUpdate.map((task) =>
            axios.put(`${import.meta.env.VITE_API}/tasks/${task._id}`, {
              order: task.order,
            })
          )
        );
        toast.success("Order updated successfully");
      } catch (err) {
        console.error("Error updating order:", err);
      }
    } else {
      // Moving a task between columns
      const sourceTasks = Array.from(columns[source.droppableId]);
      const destTasks = Array.from(columns[destination.droppableId]);
      const [movedTask] = sourceTasks.splice(source.index, 1);
      movedTask.category = destination.droppableId;
      destTasks.splice(destination.index, 0, movedTask);

      const updatedSourceTasks = sourceTasks.map((task, index) => ({
        ...task,
        order: index,
      }));
      const updatedDestTasks = destTasks.map((task, index) => ({
        ...task,
        order: index,
      }));

      setColumns({
        ...columns,
        [source.droppableId]: updatedSourceTasks,
        [destination.droppableId]: updatedDestTasks,
      });

      try {
        await axios.put(`${import.meta.env.VITE_API}/tasks/${movedTask._id}`, {
          category: destination.droppableId,
        });
        toast.success("Task moved successfully");
        await Promise.all([
          ...updatedSourceTasks.map((task) =>
            axios.put(`${import.meta.env.VITE_API}/tasks/${task._id}`, {
              order: task.order,
            })
          ),
          ...updatedDestTasks.map((task) =>
            axios.put(`${import.meta.env.VITE_API}/tasks/${task._id}`, {
              order: task.order,
            })
          ),
        ]);
      } catch (err) {
        console.error("Error updating moved task:", err);
      }
    }
  };

  // Professional Add Task Form
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    try {
      await axios.post(`${import.meta.env.VITE_API}/tasks`, newTask);
      toast.success("Task added successfully");
      setNewTask({ title: "", description: "", category: "To-Do" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add task");
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API}/tasks/${taskId}`);
      toast.success("Task deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task");
    }
  };

  // Edit task
  const handleEditTask = (task) => {
    setEditingTask(task);
  };

  // Professional Update Task Form
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    try {
      await axios.put(`${import.meta.env.VITE_API}/tasks/${editingTask._id}`, editingTask);
      toast.success("Task updated successfully");
      setEditingTask(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update task");
    }
  };

  return (
    <div
      className={`${darkMode ? "dark" : ""} p-3 container mx-auto bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100`}
    >

      <h1 className="text-3xl font-bold text-center my-4 ">Professional Task Manager</h1>

      {/* Render only one form based on whether editingTask exists */}
      {editingTask ? (
        <form
          onSubmit={handleUpdateTask}
          className="mb-4 flex flex-col md:flex-row md:items-center bg-white dark:bg-gray-800 p-4 rounded shadow"
        >
          <div className="flex-1 mb-2 md:mb-0 md:mr-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Edit Title
            </label>
            <input
              type="text"
              placeholder="Edit task title"
              value={editingTask.title}
              onChange={(e) =>
                setEditingTask({ ...editingTask, title: e.target.value })
              }
              required
              maxLength={50}
              className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex-1 mb-2 md:mb-0 md:mr-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Edit Description
            </label>
            <input
              type="text"
              placeholder="Edit description"
              value={editingTask.description}
              onChange={(e) =>
                setEditingTask({ ...editingTask, description: e.target.value })
              }
              maxLength={200}
              className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white rounded px-4 py-2"
          >
            Update Task
          </button>
          <button
            type="button"
            onClick={() => setEditingTask(null)}
            className="ml-2 bg-gray-500 hover:bg-gray-600 text-white rounded px-4 py-2"
          >
            Cancel
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleAddTask}
          className="mb-4 flex flex-col md:flex-row md:items-center bg-blue-200 dark:bg-gray-800 p-4 rounded shadow"
        >
          <div className="flex-1 mb-2 md:mb-0 md:mr-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Title
            </label>
            <input
              type="text"
              placeholder="Enter task title"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              required
              maxLength={50}
              className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex-1 mb-2 md:mb-0 md:mr-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="Enter description (optional)"
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              maxLength={200}
              className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2 mt-6 dark:bg-metal-700"
          >
            Add Task
          </button>
        </form>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          {Object.entries(columns).map(([columnId, tasks]) => (
            <Droppable droppableId={columnId} key={columnId}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="p-2 w-full mx-auto bg-blue-200 dark:bg-[#1f2937] min-h-[500px] rounded"
                >
                  <h3 className="text-lg font-bold mb-4 text-center">{columnId}</h3>
                  {tasks.length === 0 && (
                    <div className="text-center border-2 border-dashed border-blue-300 dark:border-[#374151] text-gray-500 dark:text-gray-400 py-4">
                      Drop here
                    </div>
                  )}
                  {tasks.map((task, index) => (
                    <Draggable key={task._id} draggableId={task._id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="select-none p-4 mb-2 bg-white dark:bg-[#374151] rounded shadow"
                        >
                          <h4 className="font-semibold">{task.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{task.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(task.timestamp).toLocaleString()}
                          </p>
                          <div className="flex justify-between mt-2">
                            <button
                              onClick={() => handleEditTask(task)}
                              className="mr-2 bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1 text-sm dark:bg-metal-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task._id)}
                              className="bg-red-500 hover:bg-red-600 text-white rounded px-3 py-1 text-sm dark:bg-rose-500"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default Home;
