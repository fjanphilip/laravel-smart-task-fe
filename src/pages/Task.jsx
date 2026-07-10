import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";
import { useNotifications } from "../context/NotificationContext";

export default function Task() {
  const location = useLocation();
  const { notifications } = useNotifications();

  const loggedInUserString = localStorage.getItem("user");
  const currentUser = loggedInUserString
    ? JSON.parse(loggedInUserString)
    : null;
  const isMember = currentUser?.role === "member";
  const isAdmin = currentUser?.role === "admin";
  const isManager = currentUser?.role === "manager";
  const isDeveloper = currentUser?.role === "developer";

  // 🔴 1. DEKLARASI SEMUA STATE DI PALING ATAS
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dbUsers, setDbUsers] = useState([]);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [pendingHighlightTaskId, setPendingHighlightTaskId] = useState(null);

  // Create Task Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createPriority, setCreatePriority] = useState("medium");
  const [createDueDate, setCreateDueDate] = useState("");
  const [createEstimateHours, setCreateEstimateHours] = useState("");
  const [createAssignedTo, setCreateAssignedTo] = useState("");
  const [createDependsOnTaskId, setCreateDependsOnTaskId] = useState("");
  const [createError, setCreateError] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  // Update Task Modal States
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateTaskId, setUpdateTaskId] = useState(null);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateDescription, setUpdateDescription] = useState("");
  const [updateStatus, setUpdateStatus] = useState("todo");
  const [updatePriority, setUpdatePriority] = useState("medium");
  const [updateDueDate, setUpdateDueDate] = useState("");
  const [updateEstimateHours, setUpdateEstimateHours] = useState("");
  const [updateAssignedTo, setUpdateAssignedTo] = useState("");
  const [updateDependsOnTaskId, setUpdateDependsOnTaskId] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [updatingTask, setUpdatingTask] = useState(false);

  // 🔴 2. USEEFFECT UNTUK FETCH PROJECTS DAN USERS HANYA SEKALI SAAT MOUNT
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [projResponse, usersResponse] = await Promise.all([
          api.get("/projects"),
          api.get("/users"),
        ]);
        const projectData = projResponse.data.data || [];
        setProjects(projectData);
        setDbUsers(usersResponse.data.data || []);
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // 🔴 3. USEEFFECT UNTUK HANDLE PERUBAHAN ROUTE STATE / LOCATION STATE (PROJECT ID)
  useEffect(() => {
    if (projects.length === 0) return;

    const stateProjectId = location.state?.projectId;
    const targetId = stateProjectId ? parseInt(stateProjectId, 10) : null;

    if (targetId) {
      const matched = projects.find((p) => p.id === targetId);
      if (matched) {
        setSelectedProject(matched);
        return;
      }
    }

    // Jika tidak ada targetId atau tidak cocok, pilih project pertama jika selectedProject belum diset
    if (!selectedProject && projects.length > 0) {
      setSelectedProject(projects[0]);
    }
  }, [location.state, projects]);

  // 🔴 4. FETCH TASKS BERDASARKAN PROJECT YANG DIPILIH
  const fetchTasksByProject = async () => {
    if (!selectedProject || !selectedProject.id) return;
    setLoadingTasks(true);
    try {
      const response = await api.get(`/tasks?project_id=${selectedProject.id}`);
      const taskData = response.data.data || [];

      // Map data backend agar sesuai style properti UI Neo-Brutalism Anda
      const formattedTasks = taskData.map((task) => ({
        id: task.id,
        project_id: task.project_id,
        title: task.title,
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        assigned_to: task.assigned_to || null,
        depends_on_task_id: task.depends_on_task_id || null,
        date: task.due_date || "",
        hours: task.estimate_hours ? `${task.estimate_hours}h` : "0h",
        estimate_hours: task.estimate_hours || 0,
        isUrgent: task.priority === "high" || task.priority === "urgent",

        // Helper styling kelas warna dinamis
        statusClass:
          task.status === "completed" || task.status === "done"
            ? "bg-secondary-fixed text-black font-bold"
            : task.status === "in_progress"
              ? "bg-primary-container text-black font-bold"
              : task.status === "review"
                ? "bg-tertiary-container text-black font-bold"
                : task.status === "blocked"
                  ? "bg-error text-white font-bold"
                  : "bg-white text-black font-bold",
        priorityClass:
          task.priority === "high" || task.priority === "urgent"
            ? "bg-error-container text-error font-black"
            : "bg-surface-variant text-black",
      }));

      setTasks(formattedTasks);
    } catch (err) {
      console.error("Failed to fetch tasks for this project", err);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (selectedProject?.id) {
      fetchTasksByProject();
    }
  }, [selectedProject?.id]);

  // Auto-refresh task board HANYA ketika notifikasi BARU masuk (bukan saat is_read berubah)
  // Menggunakan useRef untuk melacak panjang array sebelumnya.
  // Bug lama: setiap perubahan state notifications (termasuk markAsRead) memicu re-fetch
  // yang menyebabkan flicker/kedip saat notifikasi diklik.
  const prevNotifLengthRef = useRef(0);
  useEffect(() => {
    const currentLength = notifications.length;
    if (currentLength > prevNotifLengthRef.current && selectedProject?.id) {
      // Array bertambah = notifikasi baru dari SSE → refresh board
      const latestNotif = notifications[0];
      if (latestNotif?.task_id) {
        fetchTasksByProject();
      }
    }
    // Selalu update ref ke panjang terkini
    prevNotifLengthRef.current = currentLength;
  }, [notifications, selectedProject?.id]);

  // ✅ Scroll dan highlight elemen task berdasarkan ID
  const scrollToAndHighlightTask = (taskId) => {
    const element = document.getElementById(`task-${taskId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Hapus class dulu (jika animasi sebelumnya masih berjalan) agar restart
      element.classList.remove("task-highlight-flash");
      // Delay satu frame agar browser sempat menghapus class sebelum menambahkan kembali
      requestAnimationFrame(() => {
        element.classList.add("task-highlight-flash");
        setTimeout(() => {
          element.classList.remove("task-highlight-flash");
        }, 3600); // sesuai durasi animasi CSS: 3.5s + buffer 100ms
      });
    } else {
      console.warn(`[Highlight] Elemen task-${taskId} tidak ditemukan di DOM.`);
    }
  };

  // ✅ EFEK 1: Jalankan scroll+highlight setelah data task selesai dimuat
  // Ini adalah solusi race condition: kita tidak pakai setTimeout arbitrary,
  // melainkan menunggu `loadingTasks` benar-benar menjadi false.
  useEffect(() => {
    if (!pendingHighlightTaskId || loadingTasks) return;
    // loadingTasks sudah false, DOM sudah ter-render — aman untuk scroll
    const idToHighlight = pendingHighlightTaskId;
    setPendingHighlightTaskId(null);
    // Satu requestAnimationFrame untuk memastikan browser telah me-commit render terbaru
    requestAnimationFrame(() => {
      scrollToAndHighlightTask(idToHighlight);
    });
  }, [loadingTasks, pendingHighlightTaskId]);

  // ✅ EFEK 2: Tangani Custom Event 'highlight-task' dari Header (saat sudah di halaman /tasks)
  useEffect(() => {
    const handleHighlight = (e) => {
      const { taskId, projectId } = e.detail;
      const numericProjectId = projectId ? parseInt(projectId, 10) : null;

      if (numericProjectId && selectedProject?.id !== numericProjectId) {
        // Task ada di project berbeda — ganti project dulu, lalu tunggu loading selesai
        const matched = projects.find((p) => p.id === numericProjectId);
        if (matched) {
          setPendingHighlightTaskId(taskId);
          setSelectedProject(matched);
        }
      } else {
        // Project sudah sesuai — langsung scroll jika tasks sudah ada
        if (!loadingTasks && tasks.length > 0) {
          scrollToAndHighlightTask(taskId);
        } else {
          setPendingHighlightTaskId(taskId);
        }
      }
    };

    window.addEventListener("highlight-task", handleHighlight);
    return () => window.removeEventListener("highlight-task", handleHighlight);
  }, [selectedProject?.id, projects, tasks, loadingTasks]);

  // ✅ EFEK 3: Tangani Navigation State dari halaman lain (react-router navigate + state)
  useEffect(() => {
    if (!location.state?.highlightTaskId || projects.length === 0) return;

    const { highlightTaskId, projectId } = location.state;
    const numericProjectId = projectId ? parseInt(projectId, 10) : null;

    // Bersihkan state navigasi agar tidak diproses ulang saat re-render
    window.history.replaceState({}, document.title);

    if (numericProjectId && selectedProject?.id !== numericProjectId) {
      // Task ada di project berbeda — set pending dan ganti project
      const matched = projects.find((p) => p.id === numericProjectId);
      if (matched) {
        setPendingHighlightTaskId(highlightTaskId);
        setSelectedProject(matched);
      }
    } else {
      // Project sudah sesuai atau tidak ada projectId — set pending, tunggu loading
      setPendingHighlightTaskId(highlightTaskId);
    }
  }, [location.state, projects]);

  // 🔴 4. VARIABEL DAN STATS DERIVATIF
  const activeProjectName = selectedProject?.name || "CostumeRent Platform";
  const activeProjectId = selectedProject?.id
    ? `ID: PRJ-${selectedProject.id}`
    : "ID: PRJ-8822";
  const activeProjectStatus = selectedProject?.status || "active";

  const stats = [
    {
      title: "Total Tasks",
      value: tasks.length.toString(),
      bg: "bg-white text-black",
    },
    {
      title: "In Progress",
      value: tasks.filter((t) => t.status === "in_progress").length.toString(),
      bg: "bg-primary-container text-black",
    },
    {
      title: "Reviews Pending",
      value: tasks.filter((t) => t.status === "review").length.toString(),
      bg: "bg-tertiary-container text-black",
    },
    {
      title: "Done",
      value: tasks
        .filter((t) => t.status === "completed" || t.status === "done")
        .length.toString(),
      bg: "bg-secondary-fixed text-black",
    },
  ];

  // Open Update Modal Handler
  const handleOpenUpdateModal = (task) => {
    setUpdateTaskId(task.id);
    setUpdateTitle(task.title);
    setUpdateDescription(task.description);
    setUpdateStatus(task.status);
    setUpdatePriority(task.priority);
    setUpdateDependsOnTaskId(task.depends_on_task_id || "");

    // 🔴 PERBAIKAN: Format due date ke YYYY-MM-DD agar ter-prefill dengan benar di date input
    const rawDate = task.date || "";
    const formattedDate = rawDate.substring(0, 10);
    setUpdateDueDate(formattedDate);

    setUpdateEstimateHours(task.estimate_hours.toString());
    setUpdateAssignedTo(task.assigned_to || "");
    setUpdateError("");
    setIsUpdateModalOpen(true);
  };

  // Create Task Submission
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedProject) {
      setCreateError("Please select a project first.");
      return;
    }
    setCreatingTask(true);
    setCreateError("");

    try {
      await api.post("/tasks", {
        project_id: selectedProject.id,
        title: createTitle,
        description: createDescription,
        // Status input field is deleted from Create Task Modal (handled automatically by backend)
        priority: createPriority,
        due_date: createDueDate,
        estimate_hours: parseInt(createEstimateHours, 10),
        assigned_to: createAssignedTo ? parseInt(createAssignedTo, 10) : null,
        depends_on_task_id: createDependsOnTaskId
          ? parseInt(createDependsOnTaskId, 10)
          : null,
      });

      // Reset form states
      setCreateTitle("");
      setCreateDescription("");
      setCreatePriority("medium");
      setCreateDueDate("");
      setCreateEstimateHours("");
      setCreateAssignedTo("");
      setCreateDependsOnTaskId("");

      // Close modal
      setIsCreateModalOpen(false);

      // Re-fetch tasks
      fetchTasksByProject();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to create task";
      setCreateError(msg);
    } finally {
      setCreatingTask(false);
    }
  };

  // Update Task Submission
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setUpdatingTask(true);
    setUpdateError("");

    try {
      await api.put(`/tasks/${updateTaskId}`, {
        project_id: selectedProject.id,
        title: updateTitle,
        description: updateDescription,
        status: updateStatus,
        priority: updatePriority,
        due_date: updateDueDate,
        estimate_hours: parseInt(updateEstimateHours, 10),
        assigned_to: updateAssignedTo ? parseInt(updateAssignedTo, 10) : null,
        depends_on_task_id: updateDependsOnTaskId
          ? parseInt(updateDependsOnTaskId, 10)
          : null,
      });

      // Close modal
      setIsUpdateModalOpen(false);

      // Re-fetch tasks
      fetchTasksByProject();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to update task";
      setUpdateError(msg);
    } finally {
      setUpdatingTask(false);
    }
  };

  // Delete Task Submission
  const handleDeleteTask = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    setUpdatingTask(true);
    setUpdateError("");

    try {
      await api.delete(`/tasks/${updateTaskId}`);

      // Close modal
      setIsUpdateModalOpen(false);

      // Re-fetch tasks
      fetchTasksByProject();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to delete task";
      setUpdateError(msg);
    } finally {
      setUpdatingTask(false);
    }
  };

  return (
    <div className="bg-background min-h-screen text-on-background w-full flex overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="ml-64 flex-grow min-h-screen flex flex-col relative min-w-0">
        {/* Top Navbar */}
        <Header />

        {/* Page Content */}
        <div className="p-gutter space-y-10 flex-grow text-left">
          {/* Background Grid Accent */}
          <div className="fixed inset-0 neo-grid pointer-events-none z-0"></div>

          {/* Page Header Section */}
          <div className="relative z-20">
            <div className="flex flex-col gap-4 mb-8">
              {/* Project Status Info */}
              <div className="flex items-center gap-4">
                <span className="bg-tertiary-fixed text-on-tertiary-fixed border-2 border-black px-3 py-1 font-label-mono text-xs uppercase font-bold">
                  Project {activeProjectStatus}
                </span>
                <span className="text-outline font-label-mono text-sm">
                  {activeProjectId}
                </span>
              </div>

              {/* Dynamic Project Switcher Dropdown */}
              <div className="relative inline-block">
                <div
                  onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                  className="flex items-center gap-4 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-6 py-3 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer select-none max-w-full md:max-w-2xl"
                >
                  <h2 className="font-display-lg text-display-lg-mobile md:text-headline-md tracking-tighter text-black uppercase font-black truncate">
                    Project: {activeProjectName}
                  </h2>
                  <span
                    className={`material-symbols-outlined text-4xl font-black transition-transform duration-200 text-black flex-shrink-0 ${
                      isSwitcherOpen ? "rotate-180" : ""
                    }`}
                  >
                    expand_more
                  </span>
                </div>

                {/* Dropdown Menu */}
                {isSwitcherOpen && (
                  <div className="absolute left-0 mt-3 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-md py-2 flex flex-col z-30">
                    {projects.length === 0 ? (
                      <span className="p-4 font-label-mono text-sm text-on-surface-variant">
                        No other projects found
                      </span>
                    ) : (
                      projects.map((proj) => {
                        const isCurrent = proj.id === selectedProject?.id;
                        return (
                          <button
                            key={proj.id}
                            onClick={() => {
                              setSelectedProject(proj);
                              setIsSwitcherOpen(false);
                            }}
                            className={`px-6 py-3 text-left font-display-lg text-md uppercase font-bold hover:bg-primary-container hover:text-black transition-colors ${
                              isCurrent
                                ? "bg-surface-container-high text-black"
                                : "text-on-background"
                            }`}
                          >
                            {proj.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Settings Button */}
              {(isAdmin ||
                (selectedProject &&
                  selectedProject.user_id === currentUser?.id)) && (
                <div>
                  <button className="flex items-center gap-2 bg-surface border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all px-4 py-2 font-bold text-black">
                    <span className="material-symbols-outlined">settings</span>
                    Project Settings
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-gutter mb-12 relative z-10">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`${stat.bg} border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col justify-between`}
              >
                <p className="font-label-mono text-outline uppercase text-xs mb-4">
                  {stat.title}
                </p>
                <h3 className="font-display-lg text-4xl font-black">
                  {stat.value}
                </h3>
              </div>
            ))}
          </div>

          {/* 🔴 5. TASK LIST VIEW DENGAN INTEGRASI DYNAMIC RENDERING */}
          <div className="pb-12 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {loadingTasks ? (
                /* Skenario Loading */
                <div className="p-12 text-center border-4 border-dashed border-black font-label-mono bg-white text-black font-bold uppercase tracking-wider animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  ⚡ Fetching tasks for this project...
                </div>
              ) : tasks.length === 0 ? (
                /* Skenario Data Kosong */
                <div className="p-12 text-center border-4 border-dashed border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black">
                  <h4 className="font-display-lg text-headline-sm uppercase font-black tracking-tight">
                    No Tasks Found
                  </h4>
                  <p className="font-body-md text-sm mt-2 text-gray-700">
                    This project doesn't have any tasks assigned yet. Click the
                    action button to draft one.
                  </p>
                </div>
              ) : (
                /* Skenario Data Ada */
                tasks.map((task) => {
                  const assignedUser = dbUsers.find(
                    (u) => u.id === task.assigned_to,
                  );
                  const assigneeName = assignedUser
                    ? assignedUser.name
                    : "Unassigned";
                  const isBlocked = task.status === "blocked";

                  // Cari data prerequisite task (depends_on_task_id) untuk ditampilkan infonya jika di-block
                  const prerequisiteTask = tasks.find(
                    (t) => t.id === task.depends_on_task_id,
                  );

                  return (
                    <div
                      key={task.id}
                      id={`task-${task.id}`}
                      className={`p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group relative text-left ${
                        isBlocked
                          ? "bg-error-container border-4 border-error"
                          : "bg-white border-4 border-black"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-2">
                          <span
                            className={`${task.statusClass} border-2 border-black px-2 py-0.5 text-xs font-label-mono font-bold uppercase`}
                          >
                            {task.status}
                          </span>
                          <span
                            className={`${task.priorityClass} border-2 border-black px-2 py-0.5 text-xs font-label-mono font-bold uppercase`}
                          >
                            {task.priority}
                          </span>
                          {isBlocked && (
                            <span className="bg-error text-white border-2 border-black px-2 py-0.5 text-xs font-label-mono font-bold uppercase flex items-center gap-1 animate-pulse">
                              <span className="material-symbols-outlined text-xs font-black">
                                warning
                              </span>
                              BLOCKED
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUpdateModal(task);
                          }}
                          className="material-symbols-outlined text-outline hover:text-black transition-colors"
                        >
                          more_vert
                        </button>
                      </div>

                      <h5
                        className={`font-headline-sm text-lg mb-4 font-bold uppercase tracking-tight ${
                          isBlocked ? "text-error" : "text-black"
                        }`}
                      >
                        {task.title}
                      </h5>

                      {isBlocked && (
                        <div className="mb-4 p-3 bg-white border-2 border-error text-error font-label-mono text-xs font-bold flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm font-black">
                              block
                            </span>
                            <span>
                              THIS TASK / FEATURE IS CURRENTLY BLOCKED
                            </span>
                          </div>
                          {prerequisiteTask && (
                            <div className="text-[11px] font-normal border-t border-dashed border-error pt-1 mt-1">
                              Prerequisite:{" "}
                              <strong>"{prerequisiteTask.title}"</strong> is not
                              yet completed (Status:{" "}
                              {prerequisiteTask.status.toUpperCase()}).
                            </div>
                          )}
                        </div>
                      )}

                      {task.description && (
                        <p
                          className={`font-body-md text-sm mb-4 whitespace-pre-wrap ${
                            isBlocked
                              ? "text-error opacity-80"
                              : "text-gray-700"
                          }`}
                        >
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className={`w-6 h-6 border-2 border-black flex items-center justify-center ${
                            isBlocked
                              ? "bg-error text-white"
                              : "bg-primary-fixed"
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs font-bold">
                            person
                          </span>
                        </div>
                        <span
                          className={`text-xs font-label-mono uppercase tracking-tighter font-bold ${
                            isBlocked ? "text-error" : "text-on-surface"
                          }`}
                        >
                          Assigned: {assigneeName}
                        </span>
                      </div>

                      <hr
                        className={`border-2 mb-4 ${isBlocked ? "border-error" : "border-black"}`}
                      />

                      <div
                        className={`flex justify-between items-center text-xs font-label-mono font-bold ${
                          isBlocked ? "text-error" : "text-on-surface"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm font-bold">
                            calendar_today
                          </span>
                          {task.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm font-bold">
                            {task.isUrgent ? "priority_high" : "schedule"}
                          </span>
                          {task.hours}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* CREATE TASK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <section
            aria-modal="true"
            className="bg-white border-4 border-black w-full max-w-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col z-50 text-left"
            role="dialog"
          >
            {/* Modal Header */}
            <header className="p-6 border-b-4 border-black flex justify-between items-center bg-surface-bright">
              <h2 className="font-display-lg text-headline-sm uppercase tracking-tight text-on-surface font-black">
                Create New Task
              </h2>
              <button
                className="w-10 h-10 border-4 border-black flex items-center justify-center hover:bg-error-container transition-colors text-black"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <span className="material-symbols-outlined font-black">
                  close
                </span>
              </button>
            </header>

            {/* Modal Body */}
            <form
              onSubmit={handleCreateTask}
              className="p-8 space-y-6 overflow-y-auto max-h-[75vh]"
            >
              {createError && (
                <div className="flex items-center gap-2 p-4 border-2 border-black bg-error-container text-error font-bold">
                  <span className="material-symbols-outlined">error</span>
                  <span className="font-label-mono text-sm">{createError}</span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2 flex flex-col">
                <label
                  className="font-label-mono uppercase text-sm text-on-surface"
                  htmlFor="task_title"
                >
                  Task Title
                </label>
                <input
                  type="text"
                  id="task_title"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Design Login Flow"
                  required
                  disabled={creatingTask}
                  className="w-full border-4 border-black p-4 font-label-mono focus:bg-primary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black"
                />
              </div>

              {/* Description */}
              <div className="space-y-2 flex flex-col">
                <label
                  className="font-label-mono uppercase text-sm text-on-surface"
                  htmlFor="task_desc"
                >
                  Description
                </label>
                <textarea
                  id="task_desc"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Describe the task details..."
                  rows="3"
                  disabled={creatingTask}
                  className="w-full border-4 border-black p-4 font-label-mono focus:bg-tertiary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black"
                ></textarea>
              </div>

              {/* Status input is deleted from Create modal (handled automatically by backend) */}

              {/* Priority */}
              <div className="space-y-2 flex flex-col">
                <label
                  className="font-label-mono uppercase text-sm text-on-surface"
                  htmlFor="task_priority"
                >
                  Priority
                </label>
                <div className="relative">
                  <select
                    id="task_priority"
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value)}
                    disabled={creatingTask}
                    className="w-full border-4 border-black p-4 font-label-mono appearance-none focus:bg-secondary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer pr-10"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                    <span className="material-symbols-outlined text-black">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Due Date & Estimate Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Due Date */}
                <div className="space-y-2 flex flex-col">
                  <label
                    className="font-label-mono uppercase text-sm text-on-surface"
                    htmlFor="task_due"
                  >
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="task_due"
                    value={createDueDate}
                    onChange={(e) => setCreateDueDate(e.target.value)}
                    required
                    disabled={creatingTask}
                    className="w-full border-4 border-black p-4 font-label-mono focus:bg-primary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black"
                  />
                </div>

                {/* Estimate Hours */}
                <div className="space-y-2 flex flex-col">
                  <label
                    className="font-label-mono uppercase text-sm text-on-surface"
                    htmlFor="task_hours"
                  >
                    Estimate Hours
                  </label>
                  <input
                    type="number"
                    id="task_hours"
                    value={createEstimateHours}
                    onChange={(e) => setCreateEstimateHours(e.target.value)}
                    placeholder="e.g. 6"
                    required
                    disabled={creatingTask}
                    min="1"
                    className="w-full border-4 border-black p-4 font-label-mono focus:bg-tertiary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black"
                  />
                </div>
              </div>

              {/* Assigned To & Prerequisite Task */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assigned To */}
                <div className="space-y-2 flex flex-col">
                  <label
                    className="font-label-mono uppercase text-sm text-on-surface"
                    htmlFor="task_assign"
                  >
                    Assigned To
                  </label>
                  <div className="relative">
                    <select
                      id="task_assign"
                      value={createAssignedTo}
                      onChange={(e) => setCreateAssignedTo(e.target.value)}
                      disabled={creatingTask}
                      className="w-full border-4 border-black p-4 font-label-mono appearance-none focus:bg-primary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer pr-10"
                    >
                      <option value="">Unassigned</option>
                      {dbUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                      <span className="material-symbols-outlined text-black">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prerequisite Task (Depends On) */}
                <div className="space-y-2 flex flex-col">
                  <label
                    className="font-label-mono uppercase text-sm text-on-surface"
                    htmlFor="task_depends"
                  >
                    Prerequisite Task (Depends On)
                  </label>
                  <div className="relative">
                    <select
                      id="task_depends"
                      value={createDependsOnTaskId}
                      onChange={(e) => setCreateDependsOnTaskId(e.target.value)}
                      disabled={creatingTask}
                      className="w-full border-4 border-black p-4 font-label-mono appearance-none focus:bg-primary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer pr-10"
                    >
                      <option value="">None</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.status.toUpperCase()})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                      <span className="material-symbols-outlined text-black">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <footer className="pt-6 flex flex-col md:flex-row gap-4">
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="flex-1 bg-primary-container border-4 border-black p-4 font-display-lg text-on-primary-container font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] btn-press uppercase tracking-widest text-black disabled:opacity-50"
                >
                  {creatingTask ? "Saving..." : "Save Task"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={creatingTask}
                  className="flex-1 bg-white border-4 border-black p-4 font-display-lg text-on-surface font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] btn-press uppercase tracking-widest text-black disabled:opacity-50"
                >
                  Cancel
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* UPDATE TASK MODAL */}
      {isUpdateModalOpen &&
        (() => {
          const isBlocked = updateStatus === "blocked" && !isAdmin;

          // Cari prerequisite task title untuk info di warning blocked
          const prerequisiteTask = tasks.find(
            (t) => t.id === parseInt(updateDependsOnTaskId, 10),
          );

          return (
            <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
              <section
                aria-modal="true"
                className="bg-white border-4 border-black w-full max-w-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col z-50 text-left"
                role="dialog"
              >
                {/* Modal Header */}
                <header className="p-6 border-b-4 border-black flex justify-between items-center bg-surface-bright">
                  <h2 className="font-display-lg text-headline-sm uppercase tracking-tight text-on-surface font-black">
                    Update Task
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
                <form
                  onSubmit={handleUpdateTask}
                  className="p-8 space-y-6 overflow-y-auto max-h-[75vh]"
                >
                  {isBlocked && (
                    <div className="flex flex-col gap-2 p-4 border-4 border-error bg-error-container text-error font-bold font-label-mono text-sm uppercase">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined font-black">
                          warning
                        </span>
                        <span>
                          This task is blocked. All updates are disabled.
                        </span>
                      </div>
                      {prerequisiteTask && (
                        <div className="text-xs normal-case mt-1 border-t border-dashed border-error pt-2 font-normal">
                          Reason: Prerequisite task{" "}
                          <strong>"{prerequisiteTask.title}"</strong> is not yet
                          completed (Status:{" "}
                          {prerequisiteTask.status.toUpperCase()}).
                        </div>
                      )}
                    </div>
                  )}

                  {updateError && (
                    <div className="flex items-center gap-2 p-4 border-2 border-black bg-error-container text-error font-bold">
                      <span className="material-symbols-outlined">error</span>
                      <span className="font-label-mono text-sm">
                        {updateError}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <div className="space-y-2 flex flex-col">
                    <label
                      className="font-label-mono uppercase text-sm text-on-surface"
                      htmlFor="update_task_title"
                    >
                      Task Title
                    </label>
                    <input
                      type="text"
                      id="update_task_title"
                      value={updateTitle}
                      onChange={(e) => setUpdateTitle(e.target.value)}
                      placeholder="e.g. Design Login Flow"
                      required
                      disabled={
                        updatingTask || isBlocked || isMember || isDeveloper
                      }
                      className="w-full border-4 border-black p-4 font-label-mono focus:bg-primary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black disabled:opacity-50"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2 flex flex-col">
                    <label
                      className="font-label-mono uppercase text-sm text-on-surface"
                      htmlFor="update_task_desc"
                    >
                      Description
                    </label>
                    <textarea
                      id="update_task_desc"
                      value={updateDescription}
                      onChange={(e) => setUpdateDescription(e.target.value)}
                      placeholder="Describe the task details..."
                      rows="3"
                      disabled={
                        updatingTask || isBlocked || isMember || isDeveloper
                      }
                      className="w-full border-4 border-black p-4 font-label-mono focus:bg-tertiary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black disabled:opacity-50"
                    ></textarea>
                  </div>

                  {/* Status & Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status - 🔴 PERBAIKAN: Ditampilkan dibagian update task */}
                    <div className="space-y-2 flex flex-col">
                      <label
                        className="font-label-mono uppercase text-sm text-on-surface"
                        htmlFor="update_task_status"
                      >
                        Status
                      </label>
                      <div className="relative">
                        <select
                          id="update_task_status"
                          value={updateStatus}
                          onChange={(e) => setUpdateStatus(e.target.value)}
                          disabled={
                            updatingTask ||
                            isBlocked ||
                            (isMember &&
                              parseInt(updateAssignedTo, 10) !==
                                currentUser?.id)
                          }
                          className="w-full border-4 border-black p-4 font-label-mono appearance-none focus:bg-secondary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer pr-10 disabled:opacity-50"
                        >
                          {updateStatus === "blocked" && (
                            <option value="blocked" disabled>
                              Blocked
                            </option>
                          )}
                          <option value="todo">Todo</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                          <span className="material-symbols-outlined text-black">
                            expand_more
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2 flex flex-col">
                      <label
                        className="font-label-mono uppercase text-sm text-on-surface"
                        htmlFor="update_task_priority"
                      >
                        Priority
                      </label>
                      <div className="relative">
                        <select
                          id="update_task_priority"
                          value={updatePriority}
                          onChange={(e) => setUpdatePriority(e.target.value)}
                          disabled={
                            updatingTask || isBlocked || isMember || isDeveloper
                          }
                          className="w-full border-4 border-black p-4 font-label-mono appearance-none focus:bg-secondary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer pr-10 disabled:opacity-50"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                          <span className="material-symbols-outlined text-black">
                            expand_more
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Due Date & Estimate Hours */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Due Date */}
                    <div className="space-y-2 flex flex-col">
                      <label
                        className="font-label-mono uppercase text-sm text-on-surface"
                        htmlFor="update_task_due"
                      >
                        Due Date
                      </label>
                      <input
                        type="date"
                        id="update_task_due"
                        value={updateDueDate}
                        onChange={(e) => setUpdateDueDate(e.target.value)}
                        required
                        disabled={
                          updatingTask || isBlocked || isMember || isDeveloper
                        }
                        className="w-full border-4 border-black p-4 font-label-mono focus:bg-primary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black disabled:opacity-50"
                      />
                    </div>

                    {/* Estimate Hours */}
                    <div className="space-y-2 flex flex-col">
                      <label
                        className="font-label-mono uppercase text-sm text-on-surface"
                        htmlFor="update_task_hours"
                      >
                        Estimate Hours
                      </label>
                      <input
                        type="number"
                        id="update_task_hours"
                        value={updateEstimateHours}
                        onChange={(e) => setUpdateEstimateHours(e.target.value)}
                        placeholder="e.g. 6"
                        required
                        disabled={
                          updatingTask || isBlocked || isMember || isDeveloper
                        }
                        min="1"
                        className="w-full border-4 border-black p-4 font-label-mono focus:bg-tertiary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Assigned To & Prerequisite Task */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assigned To */}
                    <div className="space-y-2 flex flex-col">
                      <label
                        className="font-label-mono uppercase text-sm text-on-surface"
                        htmlFor="update_task_assign"
                      >
                        Assigned To
                      </label>
                      <div className="relative">
                        <select
                          id="update_task_assign"
                          value={updateAssignedTo}
                          onChange={(e) => setUpdateAssignedTo(e.target.value)}
                          disabled={
                            updatingTask || isBlocked || isMember || isDeveloper
                          }
                          className="w-full border-4 border-black p-4 font-label-mono appearance-none focus:bg-primary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer pr-10 disabled:opacity-50"
                        >
                          <option value="">Unassigned</option>
                          {dbUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                          <span className="material-symbols-outlined text-black">
                            expand_more
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Prerequisite Task (Depends On) */}
                    <div className="space-y-2 flex flex-col">
                      <label
                        className="font-label-mono uppercase text-sm text-on-surface"
                        htmlFor="update_task_depends"
                      >
                        Prerequisite Task (Depends On)
                      </label>
                      <div className="relative">
                        <select
                          id="update_task_depends"
                          value={updateDependsOnTaskId}
                          onChange={(e) =>
                            setUpdateDependsOnTaskId(e.target.value)
                          }
                          disabled={
                            updatingTask || isBlocked || isMember || isDeveloper
                          }
                          className="w-full border-4 border-black p-4 font-label-mono appearance-none focus:bg-primary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer pr-10 disabled:opacity-50"
                        >
                          <option value="">None</option>
                          {tasks
                            .filter((t) => t.id !== updateTaskId) // exclude itself
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.title} ({t.status.toUpperCase()})
                              </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                          <span className="material-symbols-outlined text-black">
                            expand_more
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <footer className="pt-6 flex flex-col md:flex-row gap-4">
                    <button
                      type="submit"
                      disabled={updatingTask || isBlocked}
                      className="flex-grow bg-primary-container border-4 border-black p-4 font-display-lg text-on-primary-container font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] btn-press uppercase tracking-widest text-black disabled:opacity-50"
                    >
                      {updatingTask ? "Updating..." : "Update Task"}
                    </button>
                    {(isAdmin ||
                      (selectedProject &&
                        selectedProject.user_id === currentUser?.id)) && (
                      <button
                        type="button"
                        onClick={handleDeleteTask}
                        disabled={updatingTask || isBlocked}
                        className="flex-grow bg-error-container border-4 border-black p-4 font-display-lg text-error font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] btn-press uppercase tracking-widest disabled:opacity-50"
                      >
                        Delete Task
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsUpdateModalOpen(false)}
                      disabled={updatingTask}
                      className="flex-grow bg-white border-4 border-black p-4 font-display-lg text-on-surface font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] btn-press uppercase tracking-widest text-black disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </footer>
                </form>
              </section>
            </div>
          );
        })()}

      {/* FAB for Global Add */}
      {!isMember && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="fixed bottom-10 right-10 w-20 h-20 bg-primary-container text-on-primary-container border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all group z-50 text-black animate-bounce"
        >
          <span className="material-symbols-outlined text-4xl group-hover:rotate-90 transition-transform font-bold">
            add
          </span>
        </button>
      )}
    </div>
  );
}
