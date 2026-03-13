import React, { useState } from "react";
import CameraCapture from "../components/CameraCapture";

const AttendanceCapture = () => {

  // -----------------------------
  // Demo class info (can come from props / API / route state)
  // -----------------------------
  const classInfo = {
    subject: "Machine Learning",
    section: "CSE-A",
    date: new Date().toLocaleDateString(),
    session_id: "SESSION123"
  };

  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // -----------------------------
  // When photo captured → call backend
  // -----------------------------
  const handlePhotoCapture = async (file) => {
    try {
      setProcessing(true);
      setError("");
      setSuccessMsg("");

      const formData = new FormData();
      formData.append("image", file);
      formData.append("session_id", classInfo.session_id);

      const res = await fetch("/api/attendance/capture", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Attendance capture failed");
      }

      // Expected response format from backend
      // [{ rollNo, name, status, confidence, photoUrl }]
      setResults(data.students || []);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // -----------------------------
  // Toggle present / absent manually
  // -----------------------------
  const toggleStatus = (index) => {
    const updated = [...results];
    updated[index].status =
      updated[index].status === "present" ? "absent" : "present";
    setResults(updated);
  };

  // -----------------------------
  // Confirm attendance save
  // -----------------------------
  const confirmAttendance = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccessMsg("");

      const res = await fetch("/api/attendance/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session_id: classInfo.session_id,
          students: results
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save attendance");
      }

      setSuccessMsg("✅ Attendance saved successfully");

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* CLASS INFO */}
      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">Attendance Capture</h2>
        <p><b>Subject:</b> {classInfo.subject}</p>
        <p><b>Section:</b> {classInfo.section}</p>
        <p><b>Date:</b> {classInfo.date}</p>
      </div>

      {/* CAMERA */}
      <CameraCapture onPhotoCapture={handlePhotoCapture} />

      {/* PROCESSING */}
      {processing && (
        <div className="mt-4 text-blue-600 font-semibold">
          🔄 Processing face recognition...
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="mt-4 bg-red-100 text-red-600 p-3 rounded">
          {error}
        </div>
      )}

      {/* RESULTS TABLE */}
      {results.length > 0 && (
        <div className="mt-6 bg-white shadow rounded-xl p-4">
          <h3 className="text-lg font-bold mb-3">Recognition Results</h3>

          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Photo</th>
                <th className="p-2 border">Roll No</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Confidence</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>

            <tbody>
              {results.map((s, i) => (
                <tr key={i}
                  className={
                    s.status === "present"
                      ? "bg-green-50"
                      : "bg-red-50"
                  }
                >
                  <td className="p-2 border">
                    <img
                      src={s.photoUrl}
                      alt="student"
                      className="w-16 h-16 object-cover rounded"
                    />
                  </td>
                  <td className="p-2 border">{s.rollNo}</td>
                  <td className="p-2 border">{s.name}</td>

                  <td className="p-2 border font-semibold">
                    {s.status}
                  </td>

                  <td className="p-2 border">
                    {(s.confidence * 100).toFixed(1)}%
                  </td>

                  <td className="p-2 border">
                    <button
                      onClick={() => toggleStatus(i)}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Toggle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* CONFIRM BUTTON */}
          <button
            onClick={confirmAttendance}
            disabled={saving}
            className="mt-4 bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700"
          >
            {saving ? "Saving..." : "Confirm Attendance"}
          </button>

          {/* SUCCESS */}
          {successMsg && (
            <div className="mt-3 bg-green-100 text-green-700 p-3 rounded">
              {successMsg}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default AttendanceCapture;