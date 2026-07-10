import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";
import { useNotifications } from "../context/NotificationContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { notifications } = useNotifications();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState("active");
  const [newProjectPriority, setNewProjectPriority] = useState("Standard");
  const [savingProject, setSavingProject] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  // Update Project Modal States
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateProjectId, setUpdateProjectId] = useState(null);
  const [updateProjectName, setUpdateProjectName] = useState("");
  const [updateProjectDescription, setUpdateProjectDescription] = useState("");
  const [updateProjectStatus, setUpdateProjectStatus] = useState("active");
  const [updateError, setUpdateError] = useState("");
  const [updatingProject, setUpdatingProject] = useState(false);

  // 1. Definisikan SEMUA fungsi fetch di luar useEffect agar bisa dipanggil kapan saja
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // Cek jika data user belum ada di localStorage (kasus redirect Socialite)
      if (!localStorage.getItem("user")) {
        const meRes = await api.get("/me");
        localStorage.setItem("user", JSON.stringify(meRes.data.data));
      }

      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks"),
        api.get("/users"),
      ]);

      setProjects(projectsRes.data.data || []);
      setTasks(tasksRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load dashboard data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Cukup gunakan SATU useEffect bersih untuk memicu semua data saat halaman terbuka
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh dashboard data when a new task status notification is received
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotif = notifications[0];
      if (latestNotif.task_id) {
        fetchDashboardData();
      }
    }
  }, [notifications]);

  const blockedTaskCount = tasks.filter(
    (task) => task.status === "blocked",
  ).length;

  const todayYMD = new Date().toISOString().split("T")[0];

  const dueTodayCount = Array.isArray(tasks)
    ? tasks.filter((task) => {
        if (!task.due_date) return false;

        const taskDate = task.due_date.split(" ")[0];

        return taskDate === todayYMD;
      }).length
    : 0;

  const totalTeam = users.length;

  // 🔴 PERBAIKAN 4: Aktifkan kembali stats variabel, hitung total secara dinamis dari API jika perlu
  const stats = [
    {
      title: "Total Projects",
      value: projects.length.toString().padStart(2, "0"), // Otomatis mengikuti jumlah data API
      bg: "bg-tertiary-container text-black",
    },
    {
      title: "Tasks Pending",
      value: blockedTaskCount.toString().padStart(2, "0"),
      bg: "bg-primary-container text-black",
    },
    {
      title: "Tasks with Deadline Today",
      value: dueTodayCount.toString().padStart(2, "0"),
      bg: "bg-secondary-container text-white",
    },
    {
      title: "Team Size",
      value: totalTeam.toString().padStart(2, "0"),
      bg: "bg-surface-container-highest text-black",
    },
  ];

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setSavingProject(true);
    setSaveError("");

    try {
      await api.post("/projects", {
        name: newProjectName,
        description: newProjectDescription,
        status: newProjectStatus,
      });

      // Reset form states
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectStatus("active");
      setNewProjectPriority("Standard");

      // Close modal
      setIsModalOpen(false);

      // Re-fetch data
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to create project";
      setSaveError(msg);
    } finally {
      setSavingProject(false);
    }
  };

  // Open Update Project Modal
  const handleOpenUpdateProjectModal = (project) => {
    setUpdateProjectId(project.id);
    setUpdateProjectName(project.name);
    setUpdateProjectDescription(project.description || "");
    setUpdateProjectStatus(project.status || "active");
    setUpdateError("");
    setIsUpdateModalOpen(true);
  };

  // Update Project Submit Handler
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setUpdatingProject(true);
    setUpdateError("");

    try {
      await api.put(`/projects/${updateProjectId}`, {
        name: updateProjectName,
        description: updateProjectDescription,
        status: updateProjectStatus,
      });

      // Close modal
      setIsUpdateModalOpen(false);

      // Re-fetch data
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to update project";
      setUpdateError(msg);
    } finally {
      setUpdatingProject(false);
    }
  };

  return (
    <div className="bg-background min-h-screen text-on-background w-full flex overflow-x-hidden" onClick={() => { /* close sidebar on content click on mobile */ }}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="ml-0 md:ml-16 lg:ml-64 flex-grow min-h-screen flex flex-col relative min-w-0 transition-all duration-300">
        {/* Top Navbar */}
        <Header />

        {/* Page Content */}
        <div className="p-gutter space-y-10 flex-grow text-left">
          {/* Background Grid Accent */}
          <div className="fixed inset-0 neo-grid pointer-events-none z-0"></div>

          {/* Header Action Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
            <div>
              <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface uppercase tracking-tight">
                My Projects
              </h2>
              <p className="font-body-lg text-on-surface-variant mt-2">
                Manage your current initiatives and track progress.
              </p>
            </div>
            {/* 🔴 ANIMASI TEKAN (active:) PADA CREATE PROJECT BUTTON */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#FF00FF] text-white font-display-lg text-headline-sm px-8 py-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase italic font-black"
            >
              Create Project
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-gutter relative z-10">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`${stat.bg} border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}
              >
                <p className="font-label-mono uppercase text-sm mb-2 opacity-80">
                  {stat.title}
                </p>
                <p className="font-display-lg text-headline-md font-black">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Projects Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10 pb-20 relative z-10">
            {projects.map((project) => {
              // 🔴 PERBAIKAN 3: Fallback data jika backend tidak memiliki properti styling/tags tertentu
              const tags = project.tags || ["Development", "Laravel"];
              const tagClasses = project.tagClasses || [
                "bg-primary-container text-black",
                "bg-secondary-container text-white",
              ];
              const statusClass =
                project.status === "active"
                  ? "bg-green-400 text-black"
                  : project.status === "completed"
                    ? "bg-secondary-fixed text-black"
                    : "bg-yellow-400 text-black";
              const btnShadowClass =
                project.btnShadowClass ||
                "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";

              return (
                <div
                  key={project.id}
                  className="bg-surface-container-lowest border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  {/* Card Top Block with Three-dots (more_vert) for Update Project */}
                  <div className="p-6 border-b-4 border-black flex justify-between items-start bg-surface-container">
                    <h3 className="font-headline-sm text-on-surface font-bold text-lg max-w-[60%] truncate">
                      {/* 🔴 PERBAIKAN 2: Menggunakan project.name sesuai dengan data API */}
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`${statusClass} border-2 border-black px-2 py-0.5 font-label-mono text-xs uppercase font-bold`}
                      >
                        {project.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenUpdateProjectModal(project);
                        }}
                        className="material-symbols-outlined text-outline hover:text-black transition-colors"
                      >
                        more_vert
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-grow">
                    <p className="font-body-md text-on-surface-variant mb-6 text-sm leading-relaxed">
                      {project.description ||
                        "No description provided for this project."}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {tags.map((tag, i) => (
                        <span
                          key={i}
                          className={`${tagClasses[i] || "bg-white text-black"} px-3 py-1 border-2 border-black font-label-mono text-[10px] font-bold`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer Button - 🔴 VIEW TASK DENGAN ROUTER NAVIGATION */}
                  <div className="p-6 pt-0 mt-auto">
                    <button
                      onClick={() =>
                        navigate("/tasks", { state: { projectId: project.id } })
                      }
                      className={`w-full bg-on-surface text-surface border-4 border-black font-headline-sm py-3 font-bold uppercase tracking-tight transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none ${btnShadowClass}`}
                    >
                      View Tasks
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty State Card */}
            <div
              onClick={() => setIsModalOpen(true)}
              className="border-4 border-dashed border-black flex flex-col items-center justify-center p-12 hover:bg-surface-container transition-all cursor-pointer group min-h-[300px]"
            >
              <div className="w-16 h-16 border-4 border-black flex items-center justify-center bg-primary-container group-hover:scale-110 transition-transform mb-4">
                <span className="material-symbols-outlined text-4xl font-bold">
                  add
                </span>
              </div>
              <p className="font-headline-sm uppercase font-bold">
                Start New Project
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* CREATE PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          {/* PROJECT MODAL */}
          <section
            aria-modal="true"
            className="bg-white border-4 border-black w-full max-w-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col z-50 text-left"
            role="dialog"
          >
            {/* Modal Header */}
            <header className="p-6 border-b-4 border-black flex justify-between items-center bg-surface-bright">
              <h2 className="font-display-lg text-headline-sm uppercase tracking-tight text-on-surface font-black">
                Create New Project
              </h2>
              <button
                className="w-10 h-10 border-4 border-black flex items-center justify-center hover:bg-error-container transition-colors text-black"
                onClick={() => setIsModalOpen(false)}
              >
                <span className="material-symbols-outlined font-black">
                  close
                </span>
              </button>
            </header>

            {/* Modal Body */}
            <form onSubmit={handleCreateProject} className="p-8 space-y-8">
              {saveError && (
                <div className="flex items-center gap-2 p-4 border-2 border-black bg-error-container text-error font-bold">
                  <span className="material-symbols-outlined">error</span>
                  <span className="font-label-mono text-sm">{saveError}</span>
                </div>
              )}

              {/* Project Name */}
              <div className="space-y-2 flex flex-col">
                <label
                  className="font-label-mono uppercase text-sm text-on-surface"
                  htmlFor="project_name"
                >
                  Project Name
                </label>
                <input
                  type="text"
                  id="project_name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Project Apollo"
                  required
                  disabled={savingProject}
                  className="w-full border-4 border-black p-4 font-label-mono focus:bg-primary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black"
                />
              </div>

              {/* Description */}
              <div className="space-y-2 flex flex-col">
                <label
                  className="font-label-mono uppercase text-sm text-on-surface"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Describe the scope and objectives..."
                  rows="4"
                  disabled={savingProject}
                  className="w-full border-4 border-black p-4 font-label-mono focus:bg-tertiary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black"
                ></textarea>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Dropdown */}
                <div className="space-y-2 flex flex-col">
                  <label
                    className="font-label-mono uppercase text-sm text-on-surface"
                    htmlFor="status"
                  >
                    Status
                  </label>
                  <div className="relative">
                    <select
                      id="status"
                      value={newProjectStatus}
                      onChange={(e) => setNewProjectStatus(e.target.value)}
                      disabled={savingProject}
                      className="w-full border-4 border-black p-4 font-label-mono appearance-none focus:bg-secondary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer pr-10"
                    >
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                      <option value="completed">Completed</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                      <span className="material-symbols-outlined text-black">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Priority Radios */}
                <div className="space-y-2 flex flex-col">
                  <label className="font-label-mono uppercase text-sm text-on-surface">
                    Priority
                  </label>
                  <div className="flex items-center h-[68px] gap-4">
                    <label
                      className={`flex-1 border-4 border-black p-4 flex items-center justify-center cursor-pointer transition-colors ${
                        newProjectPriority === "Standard"
                          ? "bg-on-surface text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value="Standard"
                        checked={newProjectPriority === "Standard"}
                        onChange={() => setNewProjectPriority("Standard")}
                        disabled={savingProject}
                        className="hidden"
                      />
                      <span className="font-label-mono">Standard</span>
                    </label>
                    <label
                      className={`flex-1 border-4 border-black p-4 flex items-center justify-center cursor-pointer transition-colors ${
                        newProjectPriority === "High"
                          ? "bg-on-surface text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value="High"
                        checked={newProjectPriority === "High"}
                        onChange={() => setNewProjectPriority("High")}
                        disabled={savingProject}
                        className="hidden"
                      />
                      <span className="font-label-mono">High</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <footer className="pt-6 flex flex-col md:flex-row gap-4">
                <button
                  type="submit"
                  disabled={savingProject}
                  className="flex-1 bg-primary-container border-4 border-black p-4 font-display-lg text-on-primary-container font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none btn-press uppercase tracking-widest text-black disabled:opacity-50"
                >
                  {savingProject ? "Saving..." : "Save Project"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={savingProject}
                  className="flex-1 bg-white border-4 border-black p-4 font-display-lg text-on-surface font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none btn-press uppercase tracking-widest text-black disabled:opacity-50"
                >
                  Cancel
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* UPDATE PROJECT MODAL */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <section
            aria-modal="true"
            className="bg-white border-4 border-black w-full max-w-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col z-50 text-left"
            role="dialog"
          >
            {/* Modal Header */}
            <header className="p-6 border-b-4 border-black flex justify-between items-center bg-surface-bright">
              <h2 className="font-display-lg text-headline-sm uppercase tracking-tight text-on-surface font-black">
                Update Project
              </h2>
              <button
                className="w-10 h-10 border-4 border-black flex items-center justify-center hover:bg-error-container transition-colors text-black"
                onClick={() => setIsUpdateModalOpen(false)}
              >
                <span className="material-symbols-outlined font-black">
                  close
                </span>
              </button>
            </header>

            {/* Modal Body */}
            <form onSubmit={handleUpdateProject} className="p-8 space-y-8">
              {updateError && (
                <div className="flex items-center gap-2 p-4 border-2 border-black bg-error-container text-error font-bold">
                  <span className="material-symbols-outlined">error</span>
                  <span className="font-label-mono text-sm">{updateError}</span>
                </div>
              )}

              {/* Project Name */}
              <div className="space-y-2 flex flex-col">
                <label
                  className="font-label-mono uppercase text-sm text-on-surface"
                  htmlFor="update_project_name"
                >
                  Project Name
                </label>
                <input
                  type="text"
                  id="update_project_name"
                  value={updateProjectName}
                  onChange={(e) => setUpdateProjectName(e.target.value)}
                  placeholder="e.g. Project Apollo"
                  required
                  disabled={updatingProject}
                  className="w-full border-4 border-black p-4 font-label-mono focus:bg-primary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black"
                />
              </div>

              {/* Description */}
              <div className="space-y-2 flex flex-col">
                <label
                  className="font-label-mono uppercase text-sm text-on-surface"
                  htmlFor="update_description"
                >
                  Description
                </label>
                <textarea
                  id="update_description"
                  value={updateProjectDescription}
                  onChange={(e) => setUpdateProjectDescription(e.target.value)}
                  placeholder="Describe the scope and objectives..."
                  rows="4"
                  disabled={updatingProject}
                  className="w-full border-4 border-black p-4 font-label-mono focus:bg-tertiary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black"
                ></textarea>
              </div>

              {/* Status Dropdown */}
              <div className="space-y-2 flex flex-col">
                <label
                  className="font-label-mono uppercase text-sm text-on-surface"
                  htmlFor="update_status"
                >
                  Status
                </label>
                <div className="relative">
                  <select
                    id="update_status"
                    value={updateProjectStatus}
                    onChange={(e) => setUpdateProjectStatus(e.target.value)}
                    disabled={updatingProject}
                    className="w-full border-4 border-black p-4 font-label-mono appearance-none focus:bg-secondary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer pr-10"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                    <option value="completed">Completed</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                    <span className="material-symbols-outlined text-black">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <footer className="pt-6 flex flex-col md:flex-row gap-4">
                <button
                  type="submit"
                  disabled={updatingProject}
                  className="flex-1 bg-primary-container border-4 border-black p-4 font-display-lg text-on-primary-container font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none btn-press uppercase tracking-widest text-black disabled:opacity-50"
                >
                  {updatingProject ? "Saving..." : "Update Project"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  disabled={updatingProject}
                  className="flex-1 bg-white border-4 border-black p-4 font-display-lg text-on-surface font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none btn-press uppercase tracking-widest text-black disabled:opacity-50"
                >
                  Cancel
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
