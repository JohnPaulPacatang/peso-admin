import React, { useState } from "react";
import { auth } from "../firebase"; // Import Firebase auth instance
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "react-toastify/dist/ReactToastify.css";

function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // Initialize useNavigate

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Login successful!", {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
            });
            // Navigate to /dashboard after successful login
            navigate("/dashboard");
        } catch (error) {
            console.error("Error signing in:", error);
            toast.error("Invalid credentials. Please try again.", {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen">
            {/* Left Section */}
            <div className="w-full md:w-1/2 bg-green-50 text-black flex flex-col justify-center items-center p-24">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-center">
                    Ready to create more opportunities?
                </h1>
                <p className="text-base md:text-lg text-center">
                    Manage job postings, connect with potential candidates, and shape the future of work.
                </p>
            </div>

            {/* Right Section */}
            <div className="w-full md:w-1/2 flex justify-center items-center bg-white">
                <div className="w-full max-w-md md:max-w-lg p-6 md:p-10 shadow-lg rounded-lg bg-white">
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-black">
                        Admin Log In
                    </h2>
                    <form onSubmit={handleLogin}>
                        <div className="mb-4 md:mb-6">
                            <label className="block text-black text-sm font-semibold mb-2" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Enter Your Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                            />
                        </div>

                        <div className="mb-4 md:mb-6">
                            <label className="block text-black text-sm font-semibold mb-2" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Enter Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 md:py-3 rounded-lg font-semibold hover:bg-gray-700 transition duration-300"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;
