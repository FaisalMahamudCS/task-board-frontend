"use client"
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            const userData = { email, password, username:name };
            const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API}/auth/signup`, userData);
            localStorage.setItem('token', data.token);  
            router.push('/dashboard'); 
        } catch (err) {
            console.log(err);
            setError('Signup failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md">
                <h1 className="text-xl font-bold mb-4">Sign Up</h1>
                {error && <div className="text-red-500 mb-4">{error}</div>} {/* Error message */}
                <form onSubmit={handleSignUp}>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="border p-2 w-full rounded"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="email"
                            placeholder="Email"
                            className="border p-2 w-full rounded"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="password"
                            placeholder="Password"
                            className="border p-2 w-full rounded"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded hover:bg-blue-600 transition">
                        Sign Up
                    </button>
                </form>
                <div className="text-center mt-4">
                    <p className="text-sm">Already have an account? <a href="/login" className="text-blue-500">Login</a></p>
                </div>
            </div>
        </div>
    );
}
