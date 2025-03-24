import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { PiEyeThin, PiEyeSlashThin } from "react-icons/pi";
import pesoLogo from "../assets/peso-logo.webp"; 

function AdminEmployerLogin({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [animationState, setAnimationState] = useState("entering"); // entering, entered
    const navigate = useNavigate();

    useEffect(() => {
        setAnimationState("entering");
        const timer = setTimeout(() => setAnimationState("entered"), 50);
        return () => clearTimeout(timer);
    }, []);


    //Login tapos tagaset ng user
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            localStorage.removeItem("admin");
            localStorage.removeItem("employer");

            const adminRef = collection(db, "admin");
            const q = query(adminRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);


            //pag admin yung acc dito punta
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


            //taga check kung nag verify kana
            if (!user.emailVerified) {
                toast.error("Please verify your email.", { duration: 2000 });
                setLoading(false);
                return;
            }

            const employerRef = doc(db, "employers", user.uid);
            const employerSnap = await getDoc(employerRef);

            //taga check kung nagsignup kaba tapos login
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

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const animationStyles = {
        entering: "opacity-0",
        entered: "opacity-100"
    };

    return (
        <div 
            className={`flex flex-col md:flex-row h-screen overflow-hidden transition-opacity duration-500 ease-in-out ${animationStyles[animationState]}`}
        >
            {/* Left side - Hide on mobile, show on medium screens and larger */}
            <div 
                className={`hidden md:flex md:w-1/2 bg-green-50 flex-col justify-center items-center p-24 transition-all duration-700 ease-in-out`}
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

            {/* Right side - Full width and centered on mobile, half width on medium screens and larger */}
            <div className="w-full md:w-1/2 flex items-center justify-center bg-white px-4 py-6 min-h-screen">
                <div 
                    className="relative bg-white p-4 sm:p-6 md:p-8 w-full max-w-md border border-neutral-300 rounded-3xl transition-opacity duration-500 ease-in-out delay-300"
                    style={{ opacity: animationState === "entered" ? 1 : 0 }}
                >
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                        <img src={pesoLogo} alt="PESO Logo" className="h-14 sm:h-16 md:h-20 object-contain" />
                    </div>

                    <h1 className="text-xl sm:text-2xl md:text-3xl mt-6 sm:mt-8 font-bold text-black-secondary text-center px-2 sm:px-6 md:px-8">
                        Admin Log In
                    </h1>
                    <p className="text-sm sm:text-base text-neutral-600 text-center mb-4 sm:mb-6 md:mb-8 mt-2">
                        Login to proceed
                    </p>

                    <form className="space-y-4 sm:space-y-6 w-full max-w-sm mx-auto" onSubmit={handleLogin}>
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
                                className="w-full mt-2 text-xs sm:text-sm px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:outline-none"
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
                                    placeholder="Enter your password"
                                    required
                                    className="w-full mt-2 text-xs sm:text-sm px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:outline-none pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-700 hover:text-gray-900 focus:outline-none"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    style={{ top: 'calc(50% + 4px)' }}
                                >
                                    {showPassword ? (
                                        <PiEyeSlashThin size={20} />
                                    ) : (
                                        <PiEyeThin size={20} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-1 sm:mt-2">
                            <Link to="/employer/forgot-password" className="text-xs sm:text-sm text-blue-600 hover:underline">
                                Forgot Password?
                            </Link>
                        </div>

                        <div className="mt-2 sm:mt-4">
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white px-4 py-2 text-xs sm:text-sm rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading && <ClipLoader size={16} color="white" />}
                                {loading ? " " : "Login"}
                            </button>
                        </div>
                    </form>

                    <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
                        Need an account?{" "}
                        <Link to="/employer-signup" className="text-blue-600 hover:underline">
                            Sign up as an employer
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AdminEmployerLogin;