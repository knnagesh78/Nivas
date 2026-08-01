import React, { useRef, useState, useEffect } from "react";
import { Camera, RotateCcw, Trash2, Upload, AlertCircle } from "lucide-react";

export default function CameraCapture({ photoUrl, onCapture, label = "Profile Picture" }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setError("");
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 400 }, height: { ideal: 400 }, facingMode: "user" },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Cannot access camera. Please allow camera permissions or upload an image instead.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Create canvas to crop and compress the captured photo
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    
    // Calculate cropped dimensions to ensure it is square
    const videoWidth = video.videoWidth || video.clientWidth || 300;
    const videoHeight = video.videoHeight || video.clientHeight || 300;
    const minDim = Math.min(videoWidth, videoHeight);
    const sx = (videoWidth - minDim) / 2;
    const sy = (videoHeight - minDim) / 2;
    
    ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, 300, 300);
    
    // Compress and call callback
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    onCapture(dataUrl);
    
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 300, 300);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        onCapture(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    onCapture("");
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
        {label}
      </label>
      
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
        {/* Photo Display / Video Live View */}
        <div className="relative h-28 w-28 rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0 flex items-center justify-center shadow-inner">
          {isCameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover scale-x-[-1]"
            />
          ) : photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile preview"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <Camera className="h-8 w-8 text-slate-400" />
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 space-y-2 text-center sm:text-left w-full">
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 p-2 rounded-xl mb-2">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {isCameraActive ? (
              <>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
                >
                  Capture Photo
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
                >
                  <Camera className="mr-1.5 h-3.5 w-3.5" />
                  Use Camera
                </button>
                <label className="inline-flex items-center px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="inline-flex items-center px-3 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-150 rounded-xl hover:bg-red-100 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
          <p className="text-[10px] text-slate-400">
            Use your web camera or upload a file. Square crop is applied automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
