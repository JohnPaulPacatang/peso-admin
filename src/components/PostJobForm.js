import React from "react";

function PostJobForm() {
  return (
    <div className="py-12 px-14">
      <h1 className="text-3xl font-bold text-gray-700 mb-6">Post a New Job</h1>
      <div className="mx-auto bg-white p-8 rounded-3xl shadow-md">

        <form>
          {/* Job Details */}
          <div className="p-8">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Job Details</h2>
            <div className="mb-4">
              <label className="block text-gray-600 mb-2" htmlFor="job-title">
                Job Title<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="job-title"
                placeholder="Ex: Product Designer"
                className="w-full border border-gray-300 rounded-3xl px-3 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-600 mb-2" htmlFor="job-description">
                Job Description<span className="text-red-500">*</span>
              </label>
              <textarea
                id="job-description"
                placeholder="Write about the job in detail..."
                className="w-full border border-gray-300 rounded-3xl px-3 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="4"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 mb-2" htmlFor="job-category">
                  Job Category
                </label>
                <select
                  id="job-category"
                  className="w-full border border-gray-300 rounded-3xl px-3 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option>Designer</option>
                  <option>Developer</option>
                  <option>Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-2" htmlFor="job-type">
                  Job Type
                </label>
                <select
                  id="job-type"
                  className="w-full border border-gray-300 rounded-3xl px-3 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option>Full Time</option>
                  <option>Part Time</option>
                  <option>Freelance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-gray-600 mb-2" htmlFor="salary-min">
                  Salary (Min)
                </label>
                <input
                  type="number"
                  id="salary-min"
                  placeholder="Min"
                  className="w-full border border-gray-300 rounded-3xl px-3 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-2" htmlFor="salary-max">
                  Salary (Max)
                </label>
                <input
                  type="number"
                  id="salary-max"
                  placeholder="Max"
                  className="w-full border border-gray-300 rounded-3xl px-3 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Skills & Experience */}
          <div className="p-8">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Skills & Experience</h2>
            <div className="mb-4">
              <label className="block text-gray-600 mb-2" htmlFor="skills">
                Skills<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="skills"
                placeholder="Add Skills"
                className="w-full border border-gray-300 rounded-3xl px-3 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 mb-2" htmlFor="experience">
                  Experience
                </label>
                <select
                  id="experience"
                  className="w-full border border-gray-300 rounded-3xl px-3 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-2" htmlFor="location">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  placeholder="Location"
                  className="w-full border border-gray-300 rounded-3xl px-3 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-gray-600 mb-2" htmlFor="industry">
                  Industry
                </label>
                <select
                  id="industry"
                  className="w-full border border-gray-300 rounded-3xl px-3 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Education</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-2" htmlFor="english-fluency">
                  English Fluency
                </label>
                <select
                  id="english-fluency"
                  className="w-full border border-gray-300 rounded-3xl px-3 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option>Basic</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* File Attachment */}
          <div className="p-8">
            <h2 className="text-xl font-medium text-gray-800 mb-4">File Attachment</h2>
            <div>
              <label className="block text-gray-600 mb-2" htmlFor="file-upload">
                Upload File
              </label>
              <input
                type="file"
                id="file-upload"
                className="block w-full text-gray-600 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="px-8">
          <button
            type="submit"
            className="w-full bg-green-500 text-white font-medium py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Post Job
          </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostJobForm;
