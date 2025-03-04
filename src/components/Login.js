import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { ClipLoader } from "react-spinners";

function AdminEmployerLogin({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [animationState, setAnimationState] = useState("entering"); // entering, entered
    const navigate = useNavigate();

    useEffect(() => {
        setAnimationState("entering");
        const timer = setTimeout(() => setAnimationState("entered"), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            localStorage.removeItem("admin");
            localStorage.removeItem("employer");

            const adminRef = collection(db, "admin");
            const q = query(adminRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const adminData = querySnapshot.docs[0].data();
                if (adminData.password === password) {
                    const adminInfo = { role: "admin", email };
                    localStorage.setItem("admin", JSON.stringify(adminInfo));
                    toast.success("Admin logged in!", { duration: 2000 });
                    onLogin();
                    navigate("/admin/dashboard");
                    return;
                } else {
                    toast.error("Invalid admin credentials.", { duration: 2000 });
                    setLoading(false);
                    return;
                }
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                toast.error("Please verify your email.", { duration: 2000 });
                setLoading(false);
                return;
            }

            const employerRef = doc(db, "employers", user.uid);
            const employerSnap = await getDoc(employerRef);

            if (employerSnap.exists()) {
                const employerData = employerSnap.data();
                if (!employerData.verified) {
                    await updateDoc(employerRef, { verified: true });
                }

                const employerInfo = {
                    role: "employer",
                    uid: user.uid,
                    email: user.email,
                    companyName: employerData.companyName,
                    companyAddress: employerData.company_address,
                    companyDescription: employerData.company_description,
                    companyPhone: employerData.company_phone,
                    contactPersonName: employerData.contact_person_name,
                    contactPersonEmail: employerData.contact_person_email,
                    linkedinProfile: employerData.linkedin_profile,
                    businessPermit: employerData.business_permit,
                    companyLogo: employerData.company_logo,
                    verified: employerData.verified
                };

                localStorage.setItem("employer", JSON.stringify(employerInfo));
                toast.success("Employer logged in!", { duration: 2000 });
                onLogin();
                navigate("/employer/dashboard");
            } else {
                toast.error("Employer not found.", { duration: 2000 });
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error("Login failed. Check credentials.", { duration: 2000 });
        } finally {
            setLoading(false);
        }
    };

    const animationStyles = {
        entering: "opacity-0",
        entered: "opacity-100"
    };

    return (
        <div 
            className={`flex flex-col md:flex-row h-screen overflow-hidden transition-opacity duration-500 ease-in-out ${animationStyles[animationState]}`}
        >
            <div 
                className={`w-full md:w-1/2 bg-green-50 flex flex-col justify-center items-center p-24 transition-all duration-700 ease-in-out`}
            >
                <h1 
                    className="text-4xl font-extrabold mb-6 text-center transition-opacity duration-500 ease-in-out delay-100"
                    style={{ opacity: animationState === "entered" ? 1 : 0 }}
                >
                    Ready to create more opportunities?
                </h1>
                <p 
                    className="text-base text-center transition-opacity duration-500 ease-in-out delay-200"
                    style={{ opacity: animationState === "entered" ? 1 : 0 }}
                >
                    Manage job postings, connect with candidates, and shape the future of work.
                </p>
            </div>
            <div 
                className={`w-full md:w-1/2 flex justify-center items-center bg-white transition-all duration-700 ease-in-out`}
            >
                <div 
                    className="w-full max-w-md p-6 shadow-lg rounded-xl bg-white transition-opacity duration-500 ease-in-out delay-300"
                    style={{ opacity: animationState === "entered" ? 1 : 0 }}
                >
                    <h2 className="text-2xl font-bold text-center mb-6">Admin Log In</h2>
                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Enter Your Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-300 ease-in-out hover:border-blue-200"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Enter Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-300 ease-in-out hover:border-blue-200"
                                required
                            />
                        </div>
                        <div className="mb-6 text-left">
                            <Link 
                                to="/employer/forgot-password" 
                                className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 ease-in-out flex justify-center items-center hover:shadow-md focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color="#ffffff" /> : "Login"}
                        </button>
                    </form>
                    <p className="text-center mt-6 text-sm">
                        Need an account?{" "}
                        <Link 
                            to="/employer-signup" 
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
                        >
                            Sign up as an employer
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AdminEmployerLogin;