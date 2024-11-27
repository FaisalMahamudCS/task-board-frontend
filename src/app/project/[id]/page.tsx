"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import { useParams, useRouter } from "next/navigation";

let socket;

export const getSocket = () => {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_API_URL);
    }
    return socket;
};

export default function TaskBoard() {
    const router = useRouter();
    const { id } = useParams(); // `id` corresponds to the project ID
    const [tasks, setTasks] = useState([]); // Stores the list of tasks
    const [statuses, setStatuses] = useState(["pending", "in_progress", "completed"]); // Task statuses
    const [newTask, setNewTask] = useState({ title: "", description: "" }); // New task
    const [taskComments, setTaskComments] = useState({}); // Maps task IDs to comments
    const [showAddTaskModal, setShowAddTaskModal] = useState(false); // Add Task modal visibility

    useEffect(() => {
        const socket = getSocket();

        const fetchTasks = async () => {
            try {
                const token = localStorage.getItem("token");
                const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API}/tasks/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTasks(data);

                // Initialize comments for each task
                const commentsMap = data.reduce((acc, task) => {
                    acc[task._id] = task.comment || ""; // Default to an empty string if no comment exists
                    return acc;
                }, {});
                setTaskComments(commentsMap);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };

        fetchTasks();

        socket.emit("joinProject", id);
        console.log(`Socket joined project room: ${id}`);

        socket.on("taskUpdated", (updatedTask) => {
            setTasks((prev) => {
                const taskIndex = prev.findIndex((task) => task._id === updatedTask._id);
                if (taskIndex > -1) {
                    const updatedTasks = [...prev];
                    updatedTasks[taskIndex] = updatedTask;
                    return updatedTasks;
                }
                return prev;
            });
        });

        socket.on("taskAdded", (newTask) => {
            setTasks((prev) => [...prev, newTask]);
        });

        return () => {
            socket.emit("leaveProject", id);
            socket.off("taskUpdated");
            socket.off("taskAdded");
        };
    }, [id]);

    /**
     * Updates the task's status.
     * @param {string} taskId - ID of the task to update
     * @param {string} status - The new status
     */
    const updateTaskStatus = async (taskId, status) => {
        const token = localStorage.getItem("token");
        try {
            const { data } = await axios.patch(
                `${process.env.NEXT_PUBLIC_API}/tasks/${taskId}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTasks((prev) =>
                prev.map((task) => (task._id === taskId ? { ...task, status: data.status } : task))
            );
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    /**
     * Updates the task's comment in the state and sends it to the backend.
     * @param {string} taskId - ID of the task to update the comment
     * @param {string} comment - The new comment text
     */
    const updateTaskComment = async (taskId, comment) => {
        const token = localStorage.getItem("token");

        // Update the local state first
        setTaskComments((prev) => ({
            ...prev,
            [taskId]: comment,
        }));

        try {
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API}/tasks/${taskId}/comments`,
                { comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Comment updated successfully");
        } catch (error) {
            console.error("Error updating comment:", error);
        }
    };

    const handleAddTask = async () => {
        const token = localStorage.getItem("token");
        try {
            const { data } = await axios.post(
                `${process.env.NEXT_PUBLIC_API}/tasks`,
                { ...newTask, projectId: id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTasks((prev) => [...prev, data]);
            setNewTask({ title: "", description: "" });
            setShowAddTaskModal(false);
        } catch (error) {
            console.error("Error adding task:", error.response?.data || error.message);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Task Board</h1>
            <button
                className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
                onClick={() => setShowAddTaskModal(true)}
            >
                Add Task
            </button>

            {/* Add Task Modal */}
            {showAddTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded shadow">
                        <h2 className="text-xl font-bold mb-4">Add New Task</h2>
                        <input
                            type="text"
                            placeholder="Task Title"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            className="border p-2 w-full mb-4"
                        />
                        <textarea
                            placeholder="Task Description"
                            value={newTask.description}
                            onChange={(e) =>
                                setNewTask({ ...newTask, description: e.target.value })
                            }
                            className="border p-2 w-full mb-4"
                        ></textarea>
                        <button
                            className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                            onClick={handleAddTask}
                        >
                            Create Task
                        </button>
                        <button
                            className="bg-red-500 text-white px-4 py-2 rounded"
                            onClick={() => setShowAddTaskModal(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Task Board - Display tasks grouped by status */}
            <div className="grid grid-cols-3 gap-4">
                {statuses.map((status) => (
                    <div key={status} className="border p-4 rounded">
                        <h2 className="font-bold mb-2">{status}</h2>
                        {tasks
                            .filter((task) => task.status === status)
                            .map((task) => (
                                <div key={task._id} className="border p-2 rounded mb-2 bg-gray-100">
                                    <h3>{task.title}</h3>
                                    <p>{task.description}</p>

                                    {/* Dropdown for Status Update */}
                                    <select
                                        value={task.status}
                                        onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                                        className="border p-2 mt-2 w-full"
                                    >
                                        {statuses.map((statusOption) => (
                                            <option key={statusOption} value={statusOption}>
                                                {statusOption}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Comment Section */}
                                    <textarea
                                        value={taskComments[task._id] || ""}
                                        onChange={(e) =>
                                            updateTaskComment(task._id, e.target.value)
                                        }
                                        placeholder="Add a comment..."
                                        className="border p-2 w-full mt-2"
                                    ></textarea>
                                </div>
                            ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
