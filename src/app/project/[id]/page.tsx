import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

export default function TaskBoard({ projectId }) {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        // Fetch tasks
        axios.get(`http://localhost:5000/tasks/${projectId}`).then((res) => {
            setTasks(res.data);
        });

        // Join project room
        socket.emit('join_project', projectId);

        // Listen for real-time updates
        socket.on('task_update', (data) => {
            setTasks((prev) =>
                prev.map((task) => (task._id === data._id ? data : task))
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [projectId]);

    return (
        <div>
            <h1>Task Board</h1>
            <ul>
                {tasks.map((task) => (
                    <li key={task._id}>
                        {task.title} - {task.status}
                    </li>
                ))}
            </ul>
        </div>
    );
}
