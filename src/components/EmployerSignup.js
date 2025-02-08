import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";

function EmployerSignup() {
    const [companyName, setCompanyName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Send email verification
            await sendEmailVerification(user);

            // Save additional data to Firestore
            await setDoc(doc(db, "employers", user.uid), {
                companyName,
                email,
                uid: user.uid,
                verified: false,  // Track verification status
            });

            toast.success("Account created! Please check your email for verification.", {
                position: "top-right",
                autoClose: 3000,
            });

            navigate("/");  // Redirect to a verification reminder page
        } catch (error) {
            console.error("Error signing up:", error);
            toast.error(error.message, {
                position: "top-right",
                autoClose: 2000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-green-50">
            <div className="w-full max-w-md p-6 shadow-lg rounded-lg bg-white">
                <h2 className="text-2xl font-bold text-center mb-6">Employer Sign Up</h2>
                <form onSubmit={handleSignup}>
                    <div className="mb-4">
                        <label className="block text-sm font-semibold mb-2">Company Name</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-semibold mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-semibold mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition duration-300 flex justify-center items-center"
                        disabled={loading}
                    >
                        {loading ? <ClipLoader size={20} color="#ffffff" /> : "Sign Up"}
                    </button>
                </form>
                <p className="text-center text-black mt-4">
                    Already have an account? <Link to="/" className="text-blue-500 hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    );
}

export default EmployerSignup;
