"use client";
import { useState, useEffect } from "react";
import axios from "axios";

import { jwtDecode } from "jwt-decode"; // Install this library
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: "", description: "" });
    const [userRole, setUserRole] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchProjects = async () => {
            const token = localStorage.getItem("token");
            if (!token) return router.push("/login");

            try {
                const decoded = jwtDecode(token);
                setUserRole(decoded?.role);
                const { data } = await axios.get(
                    `${process.env.NEXT_PUBLIC_API}/projects`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setProjects(data);
            } catch (err) {
                setError("Failed to load projects. Redirecting...");
                setTimeout(() => router.push("/login"), 2000);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [router]);

    const handleCreateProject = async () => {
        const token = localStorage.getItem("token");
        try {
            const { data } = await axios.post(
                `${process.env.NEXT_PUBLIC_API}/projects`,
                newProject,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setProjects((prev) => [...prev, data]); // Add new project to the list
            setShowModal(false); // Close modal
        } catch (err) {
            console.error("Failed to create project:", err);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen">{error}</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Projects</h1>
            {userRole === "admin" && (
                <button
                    className="mb-4 p-2 bg-blue-500 text-white rounded"
                    onClick={() => setShowModal(true)}
                >
                    Add New Project
                </button>
            )}
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

            {/* Modal for Creating a New Project */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-8 rounded shadow-lg w-96">
                        <h2 className="text-lg font-bold mb-4">Create New Project</h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleCreateProject();
                            }}
                        >
                            <div className="mb-4">
                                <label className="block font-medium mb-2">Project Name</label>
                                <input
                                    type="text"
                                    className="border rounded w-full p-2"
                                    value={newProject.name}
                                    onChange={(e) =>
                                        setNewProject((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block font-medium mb-2">Description</label>
                                <textarea
                                    className="border rounded w-full p-2"
                                    value={newProject.description}
                                    onChange={(e) =>
                                        setNewProject((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-300 text-black rounded"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
