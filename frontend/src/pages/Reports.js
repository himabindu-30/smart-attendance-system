import React, { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { api } from '../api';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Reports() {
  const [filters, setFilters] = useState({ class_id: "", start_date: "", end_date: "" });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    api("/api/classes")
      .then(r => r.json())
      .then(d => setClasses(d.classes || []))
      .catch(() => {});
  }, [token]);

  const buildParams = () => {
    const p = new URLSearchParams();
    if (filters.class_id) p.append("class_id", filters.class_id);
    if (filters.start_date) p.append("start_date", filters.start_date);
    if (filters.end_date) p.append("end_date", filters.end_date);
    return p;
  };

  const handleGenerate = async () => {
    try {
      setLoading(true); setError(""); setResult(null);
      const res = await api(`/api/reports?${buildParams()}`);
      if (!res.ok) throw new Error("Failed to generate report");
      const data = await res.json();
      const records = data.records || [];
      const present = records.filter(r => r.status === "PRESENT").length;
      const absent = records.filter(r => r.status === "ABSENT").length;
      setResult({ records, summary: { present, absent } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pieData = result ? {
    labels: ["Present", "Absent"],
    datasets: [{ data: [result.summary.present, result.summary.absent], backgroundColor: ["#22c55e", "#ef4444"] }],
  } : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f1ea" }}>
      {/* LEFT PANEL */}
      <div style={{ width: 280, flexShrink: 0, background: "#fff", borderRight: "1.5px solid #e8e0d0", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1209" }}>Report Filters</h2>

        <div>
          <label style={labelStyle}>Class</label>
          <select style={inputStyle} value={filters.class_id} onChange={e => setFilters({ ...filters, class_id: e.target.value })}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.subject_name} — {c.section}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>From Date</label>
          <input type="date" style={inputStyle} value={filters.start_date} onChange={e => setFilters({ ...filters, start_date: e.target.value })} />
        </div>

        <div>
          <label style={labelStyle}>To Date</label>
          <input type="date" style={inputStyle} value={filters.end_date} onChange={e => setFilters({ ...filters, end_date: e.target.value })} />
        </div>

        <button onClick={handleGenerate} disabled={loading} style={{ padding: "12px", background: "#1a1209", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          {loading ? "Generating..." : "Generate Report"}
        </button>

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        <button onClick={() => {
            const BASE = process.env.REACT_APP_API_URL || '';
            window.open(`${BASE}/api/reports/export/pdf?${buildParams()}`, "_blank");
          }} style={exportBtn}>📄 Export PDF</button>
            <button onClick={() => {
            const BASE = process.env.REACT_APP_API_URL || '';
            window.open(`${BASE}/api/reports/export/excel?${buildParams()}`, "_blank");
          }} style={exportBtn}>📊 Export Excel</button>
            <button onClick={() => window.print()} style={exportBtn}>🖨️ Print</button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
        {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

        {!loading && !result && (
          <div style={{ textAlign: "center", marginTop: 80, color: "#8a7a65", fontSize: 15 }}>
            Select filters and click Generate Report
          </div>
        )}

        {result && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1a1209" }}>Attendance Report</h1>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                  ✓ Present: {result.summary.present}
                </span>
                <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                  ✗ Absent: {result.summary.absent}
                </span>
              </div>
            </div>

            {(result.summary.present > 0 || result.summary.absent > 0) && (
              <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e8e0d0", padding: 24, maxWidth: 320, marginBottom: 24 }}>
                <Pie data={pieData} />
              </div>
            )}

            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e8e0d0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#faf7f2" }}>
                    {["Date", "Student", "Roll No", "Subject", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#8a7a65", borderBottom: "1.5px solid #e8e0d0", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.records.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: 32, textAlign: "center", color: "#8a7a65" }}>No records found</td></tr>
                  )}
                  {result.records.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f0ebe0" }}>
                      <td style={{ padding: "12px 16px" }}>{String(r.session_date).slice(0, 10)}</td>
                      <td style={{ padding: "12px 16px" }}>{r.student_name}</td>
                      <td style={{ padding: "12px 16px" }}>{r.roll_number}</td>
                      <td style={{ padding: "12px 16px" }}>{r.subject_name}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ color: r.status === "PRESENT" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#8a7a65", marginBottom: 5, letterSpacing: "0.06em" };
const inputStyle = { width: "100%", padding: "10px 12px", border: "1.5px solid #e8e0d0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fdf8f0" };
const exportBtn = { padding: "9px 14px", background: "#faf7f2", border: "1.5px solid #e8e0d0", borderRadius: 8, fontSize: 13, cursor: "pointer", textAlign: "left", fontWeight: 500 };
