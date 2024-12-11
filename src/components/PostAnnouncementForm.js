import React from "react";

function PostAnnouncementForm() {
  return (
    <div className="py-12 px-14">
      <h1 className="text-3xl font-bold text-gray-700 mb-6">Post a New Announcement</h1>
      <div className="mx-auto bg-white p-8 rounded-3xl shadow-md">
        <form>
          {/* Announcement Details */}
          <div className="p-8">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Announcement Details</h2>
            <div className="mb-4">
              <label className="block text-gray-600 mb-2" htmlFor="announcement-title">
                Title<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="announcement-title"
                placeholder="Ex: Sales Manager"
                className="w-full border border-gray-300 rounded-3xl px-3 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-600 mb-2" htmlFor="announcement-description">
                Description<span className="text-red-500">*</span>
              </label>
              <textarea
                id="announcement-description"
                placeholder="We are searching for an experienced Sales Manager to drive revenue growth."
                className="w-full border border-gray-300 rounded-3xl px-3 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="4"
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-gray-600 mb-2" htmlFor="location">
                Location<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                placeholder="Ex: Pasay City, Metro Manila"
                className="w-full border border-gray-300 rounded-3xl px-3 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="px-8">
            <button
              type="submit"
              className="w-full bg-green-500 text-white font-medium py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Post Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostAnnouncementForm;
