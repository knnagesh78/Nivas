import React, { useState } from "react";
import { X, Upload, Package, MapPin, Tag, FileText, Camera } from "lucide-react";
import CameraCapture from "./CameraCapture";

export default function ReportItemModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showCamera, setShowCamera] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !description.trim()) {
      alert("Please fill out all required fields.");
      return;
    }
    onSubmit({
      title: title.trim(),
      category,
      location: location.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim() || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-base tracking-tight">Report Lost Item</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Item Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Black Dell Wireless Mouse"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Category & Location grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:border-indigo-500 focus:outline-none appearance-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Electronics">Electronics</option>
                  <option value="ID & Cards">ID & Cards</option>
                  <option value="Keys">Keys</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Other">Other</option>
                </select>
                <Tag className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Last Seen Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Mess Hall Table 4"
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:outline-none pl-9"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe color, brand, scratches, distinguishing marks..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Media Reference Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reference Image (Optional)
            </label>
            
            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group max-h-48">
                <img src={imageUrl} alt="Item Reference" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <label className="flex-1 flex items-center justify-center space-x-2 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-2xl p-4 cursor-pointer transition-all">
                    <Upload className="h-5 w-5 text-indigo-500" />
                    <span className="text-xs font-semibold text-slate-600">Upload Photo File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="flex items-center justify-center space-x-2 border border-slate-200 hover:border-slate-300 bg-white rounded-2xl p-4 transition-all"
                  >
                    <Camera className="h-5 w-5 text-slate-600" />
                    <span className="text-xs font-semibold text-slate-700">Camera</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-3 text-center text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center"
            >
              {isSubmitting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                "Post Lost Item"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={(capturedUrl) => {
            setImageUrl(capturedUrl);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
