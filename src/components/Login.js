import React, { useState } from "react";
import { db } from "../firebase"; 
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { collection, query, where, getDocs } from "firebase/firestore"; 
import { ClipLoader } from "react-spinners";

function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const adminRef = collection(db, "admin");
            const q = query(adminRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.error("Email not found. Please try again.", {
                    position: "top-right",
                    autoClose: 1500,
                });
            } else {
                const adminData = querySnapshot.docs[0].data();
                if (adminData.password === password) {
                    toast.success("Login successful!", {
                        position: "top-right",
                        autoClose: 2000,
                    });
                    navigate("/dashboard"); 
                } else {
                    toast.error("Invalid credentials. Please try again.", {
                        position: "top-right",
                        autoClose: 1500,
                    });
                }
            }
        } catch (error) {
            console.error("Error logging in:", error);
            toast.error("An error occurred. Please try again later.", {
                position: "top-right",
                autoClose: 1500,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen">
            <div className="w-full md:w-1/2 bg-green-50 text-black flex flex-col justify-center items-center p-24">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-center">
                    Ready to create more opportunities?
                </h1>
                <p className="text-base md:text-lg text-center">
                    Manage job postings, connect with potential candidates, and shape the future of work.
                </p>
            </div>

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
                                className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                                required
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
                                className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 md:py-3 rounded-lg font-semibold hover:bg-gray-700 transition duration-300 flex justify-center items-center"
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color="#ffffff" /> : "Login"}
                        </button>
                    </form>
                    
                    <p className="text-center text-black mt-4">
                        Need an account? <Link to="/employer-signup" className="text-blue-500 hover:underline">Sign up as an employer</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;
