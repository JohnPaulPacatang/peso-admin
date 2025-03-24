import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { toast } from "react-hot-toast";
import axios from "axios";
import { CiCamera } from "react-icons/ci";
import { BeatLoader } from "react-spinners";

const EditJobPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);
  
    const jobFromState = location.state?.job;

    const [loading, setLoading] = useState(!jobFromState);
    const [uploading, setUploading] = useState(false);
    const [recentLogos, setRecentLogos] = useState([]);
    const [showLogoModal, setShowLogoModal] = useState(false);
    const [form, setForm] = useState(
        jobFromState || {
            company: "",
            job_title: "",
            job_description: "",
            job_category: "",
            location: "",
            salary_min: "",
            salary_max: "",
            job_type: "",
            experience: "",
            logo: "",
            skills: "",
        }
    );

    // Fetch job data
    useEffect(() => {
        const fetchJob = async () => {
            if (!jobFromState) {
                setLoading(true);
                try {
                    const jobRef = doc(db, "jobs", jobId);
                    const jobSnap = await getDoc(jobRef);
                    if (jobSnap.exists()) {
                        setForm({ id: jobSnap.id, ...jobSnap.data() });
                    } else {
                        toast.error("Job not found.");
                        navigate("/admin/jobs");
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchJob();
    }, [jobId, jobFromState, navigate]);


    //Recent logo 
    useEffect(() => {
        const fetchRecentLogos = async () => {
            try {
                const jobsRef = collection(db, "jobs");
                const querySnapshot = await getDocs(jobsRef);
                const logos = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.logo && !logos.includes(data.logo)) {
                        logos.push(data.logo);
                    }
                });

                setRecentLogos(logos.slice(0, 20));
            } catch (error) {
                console.error("Error fetching recent logos:", error);
            }
        };

        fetchRecentLogos();
    }, []);


    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSelectLogo = (logoUrl) => {
        setForm({ ...form, logo: logoUrl });
        setShowLogoModal(false);
    };


    //logo upload
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Please upload an image file (JPEG, PNG, GIF)");
            setUploading(false);
            return;
        }

        const fileName = file.name.toLowerCase();
        const potentialDuplicate = recentLogos.find(logo => {
            const logoFileName = logo.split('/').pop().toLowerCase();
            return logoFileName.includes(fileName) || fileName.includes(logoFileName);
        });

        //bawal dups
        if (potentialDuplicate) {
            toast.error("This logo already exists. Please select from existing logos.", {
                duration: 2000,
                icon: '🚫',
            });

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            setUploading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "peso-files-img");
            formData.append("cloud_name", process.env.REACT_APP_CLOUDINARY_CLOUD_NAME);
            formData.append("folder", "company-logo");

            const cloudinaryResponse = await axios.post(
                process.env.REACT_APP_CLOUDINARY_URL,
                formData
            );

            const logoUrl = cloudinaryResponse.data.secure_url;
            setForm({ ...form, logo: logoUrl });
            if (!recentLogos.includes(logoUrl)) {
                setRecentLogos([logoUrl, ...recentLogos]);
            }
         
        } catch (error) {
            console.error("Error uploading logo:", error);
            toast.error("Failed to upload logo");
        } finally {
            setUploading(false);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.job_title || !form.company || !form.job_description) {
            toast.error("Job Title, Company, and Description are required!");
            return;
        }

        const updatedData = {
            job_title: form.job_title?.trim() || "",
            company: form.company?.trim() || "",
            location: form.location?.trim() || "",
            salary_min: Number(form.salary_min) || 0,
            salary_max: Number(form.salary_max) || 0,
            experience: form.experience?.trim() || "",
            job_category: form.job_category?.trim() || "",
            job_description: form.job_description?.trim() || "",
            job_type: form.job_type?.trim() || "",
            logo: form.logo || "",
            skills: form.skills || "",
        };

        const updatePromise = new Promise(async (resolve, reject) => {
            try {
                const jobRef = doc(db, "jobs", jobId);
                await updateDoc(jobRef, updatedData);
                resolve("Job updated successfully!");
            } catch (error) {
                console.error("Update error:", error);
                reject("Error updating job.");
            }
        });

        toast.promise(updatePromise, {
            loading: "Updating job, please wait...",
            success: "Job updated successfully!",
            error: "Error updating job.",
        });

        updatePromise.then(() => {
            setTimeout(() => {
                navigate("/admin/jobs");
            }, 1000);
        });
    };


    //modal bay
    const LogoSelectorModal = () => {
        if (!showLogoModal) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Choose From Recent Logo</h3>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mt-4">
                        {recentLogos.map((logo, index) => (
                            <div
                                key={index}
                                className={`w-20 h-20 border rounded-full overflow-hidden cursor-pointer hover:border-blue-500 transition-colors ${form.logo === logo ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'}`}
                                onClick={() => handleSelectLogo(logo)}
                            >
                                <img src={logo} alt="Company logo" className="w-full h-full object-contain p-2" />
                            </div>
                        ))}
                    </div>

                    {recentLogos.length === 0 && (
                        <p className="text-center text-gray-500 py-4">No logos available</p>
                    )}

                    <div className="flex justify-end mt-6">
                        <button
                            onClick={() => setShowLogoModal(false)}
                            className="px-2 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    };


    //loaders
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <BeatLoader color="#36d7b7" size={15} />
            </div>
        );
    }
   
    return (
        <div className="w-full py-10 px-4 sm:px-6 lg:px-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 my-6">Edit Job</h2>
            <hr className="py-4"></hr>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                    <div>
                        <div className="mb-6 flex items-start gap-8">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-24 sm:w-28 h-24 sm:h-28 relative">
                                    <div className="w-full h-full border rounded-full overflow-hidden">
                                        {form.logo ? (
                                            <img
                                                src={form.logo}
                                                alt={`${form.company} logo`}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                No Logo
                                            </div>
                                        )}

                                        {uploading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-full">
                                                <BeatLoader size={8} color="#3B82F6" />
                                            </div>
                                        )}
                                    </div>

                                    {!uploading && (
                                        <div className="absolute bottom-0 right-0 flex space-x-1">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current.click()}
                                                className="bg-gray-200 rounded-full p-1 shadow-md hover:bg-gray-300 transition-colors"
                                                title="Upload new logo"
                                            >
                                                <CiCamera className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                                            </button>

                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                                accept="image/*"
                                            />
                                        </div>
                                    )}
                                </div>

                                {recentLogos.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowLogoModal(true)}
                                        className="bg-white rounded-xl text-sm px-3 py-1 shadow-md hover:bg-gray-200 text-black"
                                        title="Choose from recent logos"
                                    >
                                        Choose Logo
                                    </button>
                                )}
                            </div>

                            <div className="flex-grow">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Company</label>
                                    <input
                                        type="text"
                                        name="company"
                                        value={form.company}
                                        onChange={handleChange}
                                        className="w-full border px-3 py-2 rounded-xl shadow-sm"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Job Title</label>
                                    <input
                                        type="text"
                                        name="job_title"
                                        value={form.job_title}
                                        onChange={handleChange}
                                        className="w-full border px-3 py-2 rounded-xl shadow-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Job Category</label>
                                <input
                                    type="text"
                                    name="job_category"
                                    value={form.job_category}
                                    onChange={handleChange}
                                    className="w-full border px-3 py-2  rounded-xl shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    className="w-full border px-3 py-2  rounded-xl shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Salary Range</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    name="salary_min"
                                    value={form.salary_min}
                                    onChange={handleChange}
                                    className="w-full border px-3 py-2  rounded-xl shadow-sm"
                                    placeholder="Min Salary"
                                />
                                <input
                                    type="number"
                                    name="salary_max"
                                    value={form.salary_max}
                                    onChange={handleChange}
                                    className="w-full border px-3 py-2  rounded-xl shadow-sm"
                                    placeholder="Max Salary"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Job Type</label>
                                <select
                                    name="job_type"
                                    value={form.job_type}
                                    onChange={handleChange}
                                    className="w-full border px-3 py-2  rounded-xl shadow-sm"
                                >
                                    <option value="">Select Job Type</option>
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="Contract">Contract</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Experience</label>
                                <select
                                    name="experience"
                                    value={form.experience}
                                    onChange={handleChange}
                                    className="w-full border px-3 py-2  rounded-xl shadow-sm"
                                >
                                    <option value="">Select Experience</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Expert">Expert</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Skills</label>
                            <input
                                type="text"
                                name="skills"
                                value={form.skills}
                                onChange={handleChange}
                                className="w-full border px-3 py-2  rounded-xl shadow-sm"
                                placeholder="React, JavaScript, CSS, etc."
                            />
                        </div>
                    </div>

                    <div>
                        <div className="h-full ">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Job Description</label>
                            <textarea
                                name="job_description"
                                value={form.job_description}
                                onChange={handleChange}
                                rows={19}
                                className="w-full border px-3 py-2  rounded-xl shadow-sm"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6 space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/jobs")}
                        className="px-6 py-2 text-gray-700 bg-gray-200  rounded-xl shadow-sm hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 text-white bg-blue-600  rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </form>

            <LogoSelectorModal />
        </div>
    );
};

export default EditJobPage;