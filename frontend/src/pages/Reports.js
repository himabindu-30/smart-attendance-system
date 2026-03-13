import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";

import {
  FileText,
  FileSpreadsheet,
  Printer,
  Loader2,
} from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Reports() {
  const [reportType, setReportType] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    student_id: "",
    class_id: "",
    faculty_id: "",
    date_from: null,
    date_to: null,
    subjects: [],
  });

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      const token = localStorage.getItem("token");

      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: reportType,
          filters: {
            ...filters,
            date_from: filters.date_from,
            date_to: filters.date_to,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to generate report");

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pieData = result
    ? {
        labels: ["Present", "Absent"],
        datasets: [
          {
            data: [result.summary.present, result.summary.absent],
            backgroundColor: ["#22c55e", "#ef4444"],
          },
        ],
      }
    : null;

  const titleMap = {
    student: "Student Attendance Report",
    class: "Class Attendance Report",
    faculty: "Faculty Statistics Report",
    custom: "Custom Date Range Report",
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* LEFT PANEL */}
      <div className="md:w-80 bg-white shadow-lg p-6 space-y-4 sticky top-0 h-fit">
        <h2 className="text-xl font-bold">Report Filters</h2>

        <select
          className="w-full border p-2 rounded"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        >
          <option value="">Select Report Type</option>
          <option value="student">Student-wise Attendance</option>
          <option value="class">Class-wise Attendance</option>
          <option value="faculty">Faculty-wise Statistics</option>
          <option value="custom">Custom Date Range</option>
        </select>

        {/* Student */}
        {reportType === "student" && (
          <input
            placeholder="Search Student"
            className="w-full border p-2 rounded"
            onChange={(e) =>
              setFilters({ ...filters, student_id: e.target.value })
            }
          />
        )}

        {/* Class */}
        {(reportType === "class" || reportType === "custom") && (
          <select
            className="w-full border p-2 rounded"
            onChange={(e) =>
              setFilters({ ...filters, class_id: e.target.value })
            }
          >
            <option>Select Class</option>
            <option value="CSE-A">CSE-A</option>
            <option value="CSE-B">CSE-B</option>
          </select>
        )}

        {/* Faculty */}
        {reportType === "faculty" && (
          <select
            className="w-full border p-2 rounded"
            onChange={(e) =>
              setFilters({ ...filters, faculty_id: e.target.value })
            }
          >
            <option>Select Faculty</option>
            <option value="1">Dr Rao</option>
          </select>
        )}

        {/* Date Range */}
        {(reportType === "custom" || reportType === "student") && (
          <>
            <DatePicker
              selected={filters.date_from}
              onChange={(date) =>
                setFilters({ ...filters, date_from: date })
              }
              placeholderText="From Date"
              className="w-full border p-2 rounded"
            />

            <DatePicker
              selected={filters.date_to}
              onChange={(date) =>
                setFilters({ ...filters, date_to: date })
              }
              placeholderText="To Date"
              className="w-full border p-2 rounded"
            />
          </>
        )}

        {/* Subjects */}
        <select
          multiple
          className="w-full border p-2 rounded h-24"
          onChange={(e) =>
            setFilters({
              ...filters,
              subjects: [...e.target.selectedOptions].map((o) => o.value),
            })
          }
        >
          <option>Math</option>
          <option>Physics</option>
          <option>AI</option>
        </select>

        <button
          onClick={handleGenerate}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl text-lg font-semibold"
        >
          Generate Report
        </button>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 p-6 space-y-6">
        {loading && (
          <div className="flex items-center gap-3 text-indigo-600">
            <Loader2 className="animate-spin" />
            Generating report...
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded">{error}</div>
        )}

        {!loading && result && (
          <>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">
                {titleMap[reportType]}
              </h1>

              <div className="flex gap-3">
                <button className="p-2 bg-gray-100 rounded">
                  <FileText />
                </button>
                <button className="p-2 bg-gray-100 rounded">
                  <FileSpreadsheet />
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-gray-100 rounded"
                >
                  <Printer />
                </button>
              </div>
            </div>

            {/* PIE */}
            <div className="bg-white shadow rounded-2xl p-6 max-w-md">
              <Pie data={pieData} />
            </div>

            {/* TABLE */}
            <div className="bg-white shadow rounded-2xl overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Subject</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {result.records.length === 0 && (
                    <tr>
                      <td colSpan="3" className="p-4 text-center">
                        No records found
                      </td>
                    </tr>
                  )}

                  {result.records.map((r, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{r.date}</td>
                      <td className="p-2">{r.subject}</td>
                      <td className="p-2">
                        {r.present ? "Present" : "Absent"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && !result && (
          <div className="text-gray-400 text-center mt-20">
            Select filters and generate report
          </div>
        )}
      </div>
    </div>
  );
}