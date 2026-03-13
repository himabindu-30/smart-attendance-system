import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import {
  Users,
  BookOpen,
  CalendarCheck,
  TrendingUp,
  RefreshCcw,
} from "lucide-react";

ChartJS.register(
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({});
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [subjectWise, setSubjectWise] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const [trendRes, subjectRes, recentRes, statsRes] = await Promise.all([
        fetch("/api/dashboard/monthly-trend", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/dashboard/subject-wise", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/dashboard/recent-sessions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!trendRes.ok || !subjectRes.ok || !recentRes.ok || !statsRes.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const trendData = await trendRes.json();
      const subjectData = await subjectRes.json();
      const recentData = await recentRes.json();
      const statsData = await statsRes.json();

      setMonthlyTrend(trendData);
      setSubjectWise(subjectData);
      setRecentSessions(recentData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const avgColor =
    stats.avgAttendance > 80
      ? "text-green-600"
      : stats.avgAttendance >= 70
      ? "text-yellow-500"
      : "text-red-600";

  const lineData = {
    labels: monthlyTrend.map((m) => m.month),
    datasets: [
      {
        label: "Attendance %",
        data: monthlyTrend.map((m) => m.percentage),
        borderColor: "#4f46e5",
        backgroundColor: "#6366f1",
        tension: 0.4,
      },
    ],
  };

  const barData = {
    labels: subjectWise.map((s) => s.subject),
    datasets: [
      {
        label: "Attendance %",
        data: subjectWise.map((s) => s.percentage),
        backgroundColor: "#22c55e",
      },
    ],
  };

  if (loading)
    return (
      <div className="p-6 grid gap-6">
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 animate-pulse rounded-xl"
            ></div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-72 bg-gray-200 animate-pulse rounded-xl"></div>
          <div className="h-72 bg-gray-200 animate-pulse rounded-xl"></div>
        </div>

        <div className="h-72 bg-gray-200 animate-pulse rounded-xl"></div>
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-100 text-red-600 p-4 rounded-xl">
          {error}
          <button
            onClick={fetchDashboard}
            className="ml-4 px-3 py-1 bg-red-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow"
        >
          <RefreshCcw size={18} />
          Refresh
        </button>
      </div>

      {/* TOP ROW */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={<Users />}
        />
        <StatCard
          title="Total Classes"
          value={stats.totalClasses}
          icon={<BookOpen />}
        />
        <StatCard
          title="Today's Sessions"
          value={stats.todaySessions}
          icon={<CalendarCheck />}
        />
        <StatCard
          title="Average Attendance"
          value={`${stats.avgAttendance}%`}
          icon={<TrendingUp />}
          valueColor={avgColor}
        />
      </div>

      {/* MIDDLE ROW */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-2xl p-4">
          <h2 className="font-semibold mb-3">Monthly Attendance Trend</h2>
          <Line data={lineData} />
        </div>

        <div className="bg-white shadow rounded-2xl p-4">
          <h2 className="font-semibold mb-3">Subject-wise Attendance</h2>
          <Bar data={barData} />
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="bg-white shadow rounded-2xl p-4 overflow-x-auto">
        <h2 className="font-semibold mb-4">Recent Sessions</h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Class</th>
              <th className="p-2 text-left">Faculty</th>
              <th className="p-2">Present</th>
              <th className="p-2">Absent</th>
              <th className="p-2">%</th>
            </tr>
          </thead>

          <tbody>
            {recentSessions.slice(0, 10).map((s, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">{s.date}</td>
                <td className="p-2">{s.className}</td>
                <td className="p-2">{s.faculty}</td>
                <td className="p-2 text-center">{s.present}</td>
                <td className="p-2 text-center">{s.absent}</td>
                <td className="p-2 text-center font-semibold">
                  {s.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, valueColor = "text-gray-800" }) {
  return (
    <div className="bg-white shadow rounded-2xl p-4 flex items-center gap-4">
      <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
        {icon}
      </div>

      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}