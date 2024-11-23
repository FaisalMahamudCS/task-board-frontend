import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import io from 'socket.io-client';

export default function TaskBoard() {
    const router = useRouter();
    const { id } = router.query;
    const [tasks, setTasks] = useState([]);
    const [statuses, setStatuses] = useState(['Pending', 'In Progress', 'Completed']);
    const socket = io(process.env.NEXT_PUBLIC_API_URL);

    useEffect(() => {
        const fetchTasks = async () => {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API}/tasks?projectId=${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTasks(data);
        };
        fetchTasks();

        socket.emit('joinProject', id);
        socket.on('taskUpdated', (updatedTask) => {
            setTasks((prev) =>
                prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
            );
        });

        return () => socket.disconnect();
    }, [id, socket]);

    const updateTaskStatus = async (taskId, status) => {
        const token = localStorage.getItem('token');
        await axios.patch(
            `/api/tasks/${taskId}/status`,
            { status },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Task Board</h1>
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
                                    onClick={() => updateTaskStatus(task._id, 'In Progress')}
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
