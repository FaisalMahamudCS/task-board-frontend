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
    const { id } = useParams();
    const [tasks, setTasks] = useState([]);
    const [statuses, setStatuses] = useState(["pending", "in_progress", "completed"]);
    const [newTask, setNewTask] = useState({ title: "", description: "" });
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_API_URL);

        const fetchTasks = async () => {
            try {
                const token = localStorage.getItem("token");
                const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API}/tasks/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTasks(data);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };

        fetchTasks();

        // Join the project room
        // socket.emit("joinProject", id);

        // // Listen for task updates
        // const handleTaskUpdated = (updatedTask) => {
        //     console.log("updatedTask", updatedTask);
        //     setTasks((prev) =>
        //         prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
        //     );
        // };

        // const handleTaskAdded = (newTask) => {
        //     setTasks((prev) => [...prev, newTask]);
        // };

        // socket.on("taskUpdated", handleTaskUpdated);
        // socket.on("taskAdded", handleTaskAdded);

        // // Cleanup listeners and leave room
        // return () => {
        //     socket.emit("leaveProject", id);
        //     socket.off("taskUpdated", handleTaskUpdated);
        //     socket.off("taskAdded", handleTaskAdded);
        // };
        socket.connect(); // Connect the socket
        socket.emit("joinProject", id);
        console.log(`Socket joined project room: ${id}`);


        // Handle task updates
        socket.on("taskUpdated", (updatedTask) => {
            console.log("Tassk updated:", updatedTask)
            
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
    
        // Cleanup
        // return () => {
        //     socket.emit("leaveProject", id);
        //     socket.off("taskUpdated");
        //     socket.off("taskAdded");
        // };
    }, [id]); // Only re-run when `id` changes

    const updateTaskStatus = async (taskId, status) => {
        const token = localStorage.getItem("token");
    
        // Optimistically update the state
        setTasks((prev) =>
            prev.map((task) =>
                task._id === taskId ? { ...task, status } : task
            )
        );
    
        try {
            // Send the patch request
            const { data: updatedTask } = await axios.patch(
                `${process.env.NEXT_PUBLIC_API}/tasks/${taskId}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            // Ensure the local state is synced with the backend response
            setTasks((prev) =>
                prev.map((task) =>
                    task._id === updatedTask._id ? updatedTask : task
                )
            );
        } catch (error) {
            console.error("Failed to update task status:", error);
    
            // Rollback optimistic update on error
            setTasks((prev) =>
                prev.map((task) =>
                    task._id === taskId ? { ...task, status: prev.find((t) => t._id === taskId).status } : task
                )
            );
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
            setTasks((prev) => [...prev, data]); // Update the task list
            setNewTask({ title: "", description: "" }); // Reset the form
            setShowAddTaskModal(false); // Close the modal
        } catch (error) {
            console.error("Error adding task:", error.response?.data || error.message);
        }
    };
console.log("Taskks:", tasks);
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Task Board</h1>

            {/* Add Task Button */}
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
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
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

            {/* Task Board */}
            <div className="grid grid-cols-3 gap-4">
                {statuses.map((status) => (
                    <div key={status} className="border p-4 rounded">
                        <h2 className="font-bold mb-2">{status}</h2>
                        {tasks
                            .filter((task) => task.status === status)
                            .map((task) => (
                                <div
                                    key={task._id}
                                    className="border p-2 rounded mb-2 bg-gray-100"
                                    onClick={() => updateTaskStatus(task._id, "in_progress")}
                                >
                                    <h3>{task.title}</h3>
                                    <p>{task.description}</p>
                                </div>
                            ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
