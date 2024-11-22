import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const [projects, setProjects] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const fetchProjects = async () => {
            const token = localStorage.getItem('token');
            try {
                const { data } = await axios.get('/api/projects', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProjects(data);
            } catch {
                router.push('/login');
            }
        };
        fetchProjects();
    }, [router]);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Projects</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                    <div
                        key={project._id}
                        className="border p-4 rounded shadow cursor-pointer"
                        onClick={() => router.push(`/project/${project._id}`)}
                    >
                        <h2 className="font-bold">{project.name}</h2>
                        <p>{project.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
