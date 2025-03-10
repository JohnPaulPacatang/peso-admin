import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ClipLoader } from "react-spinners";
import { PiEyeThin, PiEyeSlashThin } from "react-icons/pi";
import pesoLogo from "../assets/peso-logo.webp";

function EmployerSignup() {
    const [companyName, setCompanyName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const checkIfEmployerExists = async (companyName, email) => {
        const q = query(
            collection(db, "employers"),
            where("companyName", "==", companyName),
        );
        const q2 = query(
            collection(db, "employers"),
            where("email", "==", email),
        );

        const nameSnapshot = await getDocs(q);
        const emailSnapshot = await getDocs(q2);

        if (!nameSnapshot.empty) {
            return { exists: true, field: "Company Name" };
        }
        if (!emailSnapshot.empty) {
            return { exists: true, field: "Email Address" };
        }
        return { exists: false };
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long.", { duration: 3000 });
            return;
        }
        setLoading(true);

        try {
            const existingEmployer = await checkIfEmployerExists(companyName, email);
            if (existingEmployer.exists) {
                toast.error(`${existingEmployer.field} is already in use.`, { duration: 3000 });
                setLoading(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await sendEmailVerification(user);

            await setDoc(doc(db, "employers", user.uid), {
                companyName,
                email,
                uid: user.uid,
                verified: false,
                createdAt: new Date(),
            });

            toast.success("Account created! Verify your email before signing in.", { duration: 3000 });
            navigate("/login");
        } catch (error) {
            toast.error(`Error signing up: ${error.message}`, { duration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4 py-6">
            <div className="relative bg-white p-4 sm:p-6 md:p-8 w-full max-w-md border border-gray-300 rounded-3xl">

                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                    <img src={pesoLogo} alt="PESO Logo" className="h-14 sm:h-16 md:h-20 object-contain" />
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl mt-6 sm:mt-8 font-bold text-gray-800 text-center px-2 sm:px-6 md:px-8">
                    Employer Registration
                </h1>
                <p className="text-sm sm:text-base text-gray-600 text-center mb-4 sm:mb-6 md:mb-8 mt-2">
                    Create your employer account to get started
                </p>

                <form className="space-y-4 sm:space-y-6 w-full max-w-sm mx-auto" onSubmit={handleSignup}>
                    <div>
                        <label htmlFor="companyName" className="block text-xs sm:text-sm font-medium text-gray-700">
                            Company Name:
                        </label>
                        <input
                            type="text"
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Enter your company name"
                            required
                            className="w-full mt-2 text-xs sm:text-sm px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700">
                            Email:
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            autocomplete="email"
                            required
                            className="w-full mt-2 text-xs sm:text-sm px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700">
                            Password:
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password (min. 6 characters)"
                                required
                                className="w-full mt-2 text-xs sm:text-sm px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:outline-none pr-10"
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-2 top-1/2 transform -translate-y-1/4 text-gray-500 hover:text-gray-700 focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <PiEyeSlashThin size={16} />
                                ) : (
                                    <PiEyeThin size={16} />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="mt-2 sm:mt-4">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white px-4 py-2 text-xs sm:text-sm rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading && <ClipLoader size={16} color="white" />}
                            {loading ? " " : "Sign Up"}
                        </button>
                    </div>
                </form>

                <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
                    Already have an account?{" "}
                    <Link to="/" className="text-blue-600 hover:underline">
                        Sign in here
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default EmployerSignup;