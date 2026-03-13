import React, { useEffect, useRef, useState } from "react";

const CameraCapture = ({ onPhotoCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // -----------------------------
  // Start Camera on Component Mount
  // -----------------------------
  useEffect(() => {
    startCamera();

    return () => {
      // stop camera when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // -----------------------------
  // Function to Start Camera
  // -----------------------------
  const startCamera = async () => {
    try {
      setError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraReady(true);
    } catch (err) {
      console.error(err);
      setError("Camera access denied or not available.");
    }
  };

  // -----------------------------
  // Capture Photo
  // -----------------------------
  const capturePhoto = () => {
    try {
      setLoading(true);

      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");

      // draw current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // convert to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          setError("Failed to capture image.");
          setLoading(false);
          return;
        }

        const file = new File([blob], "attendance.jpg", {
          type: "image/jpeg"
        });

        setCapturedImage(URL.createObjectURL(blob));
        setLoading(false);

        // send file to parent
        if (onPhotoCapture) {
          onPhotoCapture(file);
        }

      }, "image/jpeg", 0.95);

    } catch (err) {
      console.error(err);
      setError("Error capturing photo.");
      setLoading(false);
    }
  };

  // -----------------------------
  // Retake Photo
  // -----------------------------
  const retakePhoto = () => {
    setCapturedImage(null);
    setError("");
  };

  // -----------------------------
  // Submit (optional extra action)
  // -----------------------------
  const submitPhoto = () => {
    // Parent already receives file in capture step
    alert("Photo submitted for attendance");
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 bg-white shadow-xl rounded-2xl">

      <h2 className="text-xl font-bold mb-4 text-center">
        Camera Attendance Capture
      </h2>

      {error && (
        <div className="bg-red-100 text-red-600 p-2 mb-3 rounded">
          {error}
        </div>
      )}

      {/* LIVE CAMERA */}
      {!capturedImage && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full rounded-lg border"
        />
      )}

      {/* CAPTURED IMAGE */}
      {capturedImage && (
        <img
          src={capturedImage}
          alt="Captured"
          className="w-full rounded-lg border"
        />
      )}

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* BUTTONS */}
      <div className="flex justify-center gap-3 mt-4">

        {!capturedImage && (
          <button
            onClick={capturePhoto}
            disabled={!cameraReady || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Capturing..." : "Capture Photo"}
          </button>
        )}

        {capturedImage && (
          <>
            <button
              onClick={retakePhoto}
              className="bg-yellow-500 text-white px-4 py-2 rounded-xl hover:bg-yellow-600"
            >
              Retake
            </button>

            <button
              onClick={submitPhoto}
              className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700"
            >
              Submit
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default CameraCapture;