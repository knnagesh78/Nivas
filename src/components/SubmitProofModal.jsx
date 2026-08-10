import React, { useState } from "react";
import { X, Upload, ShieldCheck, Camera, FileText } from "lucide-react";
import CameraCapture from "./CameraCapture";

export default function SubmitProofModal({ isOpen, onClose, item, onSubmit, isSubmitting }) {
  const [proofDetails, setProofDetails] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [showCamera, setShowCamera] = useState(false);

  if (!isOpen || !item) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!proofDetails.trim()) {
      alert("Please provide details proving ownership.");
      return;
    }
    onSubmit({
      proofDetails: proofDetails.trim(),
      proofImageUrl: proofImageUrl.trim() || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-indigo-900 text-white">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-indigo-300" />
            <h3 className="font-bold text-base tracking-tight">Submit Proof of Ownership</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-indigo-900">
              Item: <span className="font-bold">{item.title}</span>
            </p>
            <p className="text-xs text-indigo-700 mt-1">
              Provide unique details only you would know (e.g. serial numbers, custom marks, lock codes, exact contents inside).
            </p>
          </div>

          {/* Proof Details Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ownership Details <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="e.g. Serial No. #XYZ-9876, scratch on the top left corner, contains 2 blue pens and an ID card..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:outline-none"
              value={proofDetails}
              onChange={(e) => setProofDetails(e.target.value)}
            />
          </div>

          {/* Proof Media Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Proof Photo / Receipt (Optional)
            </label>

            {proofImageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group max-h-48">
                <img src={proofImageUrl} alt="Proof" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setProofImageUrl("")}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <label className="flex-1 flex items-center justify-center space-x-2 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-2xl p-4 cursor-pointer transition-all">
                  <Upload className="h-5 w-5 text-indigo-500" />
                  <span className="text-xs font-semibold text-slate-600">Upload Receipt / ID Photo</span>
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
                "Submit Proof to Warden"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={(capturedUrl) => {
            setProofImageUrl(capturedUrl);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
