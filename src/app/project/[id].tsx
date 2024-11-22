import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FileUpload from '../../components/FileUpload';

export default function TaskDetails({ taskId }) {
    const [task, setTask] = useState(null);

    useEffect(() => {
        axios.get(`http://localhost:5000/tasks/${taskId}`).then((res) => setTask(res.data));
    }, [taskId]);

    const handleFileUploaded = (fileUrl) => {
        setTask((prev) => ({
            ...prev,
            attachments: [...prev.attachments, fileUrl],
        }));
    };

    if (!task) return <p>Loading...</p>;

    return (
        <div>
            <h1>{task.title}</h1>
            <p>{task.description}</p>

            <h3>Attachments</h3>
            <ul>
                {task.attachments.map((file, index) => (
                    <li key={index}>
                        <a href={file} target="_blank" rel="noopener noreferrer">
                            {file.split('/').pop()}
                        </a>
                    </li>
                ))}
            </ul>

            <FileUpload taskId={taskId} onFileUploaded={handleFileUploaded} />
        </div>
    );
}
