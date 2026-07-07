import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";

export default function Settings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Update User Modal States
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateUserId, setUpdateUserId] = useState(null);
  const [updateUserName, setUpdateUserName] = useState("");
  const [updateUserEmail, setUpdateUserEmail] = useState("");
  const [updateUserPassword, setUpdateUserPassword] = useState("");
  const [updateUserRole, setUpdateUserRole] = useState("developer");
  const [updatingUser, setUpdatingUser] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/users");
      setUsers(response.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenUpdateModal = (user) => {
    setUpdateUserId(user.id);
    setUpdateUserName(user.name || "");
    setUpdateUserEmail(user.email || "");
    setUpdateUserPassword("");
    setUpdateUserRole(user.role || "developer");
    setUpdateError("");
    setShowPassword(false);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setUpdatingUser(true);
    setUpdateError("");

    try {
      await api.put(`/users/${updateUserId}`, {
        name: updateUserName,
        email: updateUserEmail,
        password: updateUserPassword || undefined,
        role: updateUserRole,
      });

      setIsUpdateModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to update user details.";
      setUpdateError(msg);
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      return;
    }

    setUpdatingUser(true);
    setUpdateError("");

    try {
      await api.delete(`/users/${updateUserId}`);
      setIsUpdateModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to delete user.";
      setUpdateError(msg);
    } finally {
      setUpdatingUser(false);
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
            <div>
              <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface uppercase tracking-tight">
                User Management
              </h2>
              <p className="font-body-lg text-on-surface-variant mt-2">
                Manage roles and system permissions for your workspace.
              </p>
            </div>
          </div>

          {/* Quick Stats Bento Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter relative z-10">
            {/* Total Active Users */}
            <div className="bg-tertiary-container border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
              <p className="font-label-mono text-on-tertiary-container mb-2 uppercase">Total Active Users</p>
              <p className="font-display-lg text-4xl font-black">{users.length}</p>
              <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl opacity-10 group-hover:rotate-12 transition-transform" data-icon="person">person</span>
            </div>

            {/* Pending Role Update */}
            <div className="bg-primary-container border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
              <p className="font-label-mono text-on-primary-container mb-2 uppercase">Pending Role Update</p>
              <p className="font-display-lg text-4xl font-black">02</p>
              <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl opacity-10 group-hover:rotate-12 transition-transform" data-icon="mail">mail</span>
            </div>

            {/* Security Alerts */}
            <div className="bg-secondary-fixed border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
              <p className="font-label-mono text-on-secondary-container mb-2 uppercase">Security Alerts</p>
              <p className="font-display-lg text-4xl font-black text-error">00</p>
              <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl opacity-10 group-hover:rotate-12 transition-transform" data-icon="security">security</span>
            </div>
          </div>

          {/* User List Section */}
          <div className="bg-surface border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative z-10">
            {/* Table Header */}
            <div className="grid grid-cols-12 border-b-4 border-black bg-surface-container-high p-4 font-label-mono uppercase tracking-widest text-on-surface-variant font-bold text-sm">
              <div className="col-span-4">User Profile</div>
              <div className="col-span-4">Email Address</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {loading ? (
              <div className="p-12 text-center font-label-mono text-black font-bold uppercase animate-pulse">
                ⚡ Loading users database...
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center font-label-mono text-outline">
                No users found.
              </div>
            ) : (
              users.map((user) => {
                const roleColor =
                  user.role === "admin"
                    ? "bg-secondary text-white font-bold"
                    : user.role === "manager"
                      ? "bg-primary-container text-black font-bold"
                      : "bg-tertiary-fixed-dim text-black font-bold";

                // Generate consistent mockup avatar if not present
                const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";

                return (
                  <div key={user.id} className="grid grid-cols-12 items-center p-6 border-b-4 border-black hover:bg-surface-container transition-colors group">
                    <div className="col-span-4 flex items-center gap-4">
                      <div className="w-12 h-12 border-2 border-black bg-primary-fixed flex items-center justify-center font-display-lg text-lg font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                        {initial}
                      </div>
                      <div>
                        <p className="font-body-lg text-md font-bold text-black">{user.name}</p>
                        <p className="font-label-mono text-xs opacity-60">ID: TM-{user.id}</p>
                      </div>
                    </div>
                    <div className="col-span-4 font-label-mono text-sm text-black">{user.email}</div>
                    <div className="col-span-2">
                      <span className={`${roleColor} px-3 py-1 border-2 border-black font-label-mono text-xs uppercase`}>
                        {user.role || "Member"}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <button
                        onClick={() => handleOpenUpdateModal(user)}
                        className="p-2 hover:bg-primary-container border-2 border-transparent hover:border-black transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                      >
                        <span className="material-symbols-outlined text-black font-bold">more_vert</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Pagination / Status */}
          <div className="flex justify-between items-center mt-8 p-6 bg-on-surface text-surface border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative z-10">
            <p className="font-label-mono text-white">Displaying {users.length} users</p>
            <div className="flex gap-4">
              <button className="px-6 py-2 border-2 border-white bg-transparent hover:bg-white hover:text-on-surface transition-all font-bold active:translate-x-0.5 active:translate-y-0.5">
                PREV
              </button>
              <button className="px-6 py-2 border-2 border-white bg-white text-on-surface hover:translate-x-1 hover:translate-y-1 hover:shadow-[-4px_-4px_0px_0px_rgba(255,255,255,0.5)] transition-all font-bold active:translate-x-0.5 active:translate-y-0.5">
                NEXT
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* UPDATE USER MODAL */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-300 text-left">
            {/* Modal Header */}
            <header className="p-6 border-b-4 border-black bg-primary-container flex justify-between items-center">
              <h2 className="font-display-lg text-headline-sm font-black uppercase text-black">Update User</h2>
              <button
                className="w-10 h-10 border-4 border-black bg-white flex items-center justify-center hover:bg-error hover:text-white transition-all cursor-pointer text-black"
                onClick={() => setIsUpdateModalOpen(false)}
              >
                <span className="material-symbols-outlined font-black">close</span>
              </button>
            </header>

            {/* Modal Body */}
            <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
              {updateError && (
                <div className="flex items-center gap-2 p-4 border-2 border-black bg-error-container text-error font-bold">
                  <span className="material-symbols-outlined">error</span>
                  <span className="font-label-mono text-sm">{updateError}</span>
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-2 flex flex-col">
                <label className="font-label-mono uppercase text-sm text-on-surface" htmlFor="name">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={updateUserName}
                  onChange={(e) => setUpdateUserName(e.target.value)}
                  placeholder="Enter full name"
                  required
                  disabled={updatingUser}
                  className="w-full border-4 border-black p-4 font-body-lg focus:bg-primary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2 flex flex-col">
                <label className="font-label-mono uppercase text-sm text-on-surface" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={updateUserEmail}
                  onChange={(e) => setUpdateUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  disabled={updatingUser}
                  className="w-full border-4 border-black p-4 font-body-lg focus:bg-primary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2 flex flex-col">
                <label className="font-label-mono uppercase text-sm text-on-surface" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={updateUserPassword}
                    onChange={(e) => setUpdateUserPassword(e.target.value)}
                    placeholder="Leave blank to keep unchanged"
                    disabled={updatingUser}
                    className="w-full border-4 border-black p-4 font-body-lg focus:bg-primary-container focus:outline-none transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black pr-12"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant cursor-pointer select-none"
                  >
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </div>
              </div>

              {/* Role Selector */}
              <div className="space-y-4 flex flex-col">
                <label className="font-label-mono uppercase text-sm text-on-surface">
                  Role
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {/* Admin */}
                  <label className={`relative flex items-center gap-3 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-surface-container transition-all ${
                    updateUserRole === "admin"
                      ? "bg-tertiary-container translate-x-0.5 translate-y-0.5 shadow-none"
                      : "bg-white"
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={updateUserRole === "admin"}
                      onChange={() => setUpdateUserRole("admin")}
                      disabled={updatingUser}
                      className="hidden"
                    />
                    <div className="w-6 h-6 border-4 border-black bg-white flex items-center justify-center shrink-0">
                      {updateUserRole === "admin" && <div className="w-3 h-3 bg-on-surface"></div>}
                    </div>
                    <span className="font-bold text-sm">Admin</span>
                  </label>

                  {/* Manager */}
                  <label className={`relative flex items-center gap-3 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-surface-container transition-all ${
                    updateUserRole === "manager"
                      ? "bg-tertiary-container translate-x-0.5 translate-y-0.5 shadow-none"
                      : "bg-white"
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="manager"
                      checked={updateUserRole === "manager"}
                      onChange={() => setUpdateUserRole("manager")}
                      disabled={updatingUser}
                      className="hidden"
                    />
                    <div className="w-6 h-6 border-4 border-black bg-white flex items-center justify-center shrink-0">
                      {updateUserRole === "manager" && <div className="w-3 h-3 bg-on-surface"></div>}
                    </div>
                    <span className="font-bold text-sm">Manager</span>
                  </label>

                  {/* Developer */}
                  <label className={`relative flex items-center gap-3 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-surface-container transition-all ${
                    updateUserRole === "developer"
                      ? "bg-tertiary-container translate-x-0.5 translate-y-0.5 shadow-none"
                      : "bg-white"
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="developer"
                      checked={updateUserRole === "developer"}
                      onChange={() => setUpdateUserRole("developer")}
                      disabled={updatingUser}
                      className="hidden"
                    />
                    <div className="w-6 h-6 border-4 border-black bg-white flex items-center justify-center shrink-0">
                      {updateUserRole === "developer" && <div className="w-3 h-3 bg-on-surface"></div>}
                    </div>
                    <span className="font-bold text-sm">Dev</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col gap-4 pt-6">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsUpdateModalOpen(false)}
                    disabled={updatingUser}
                    className="flex-1 bg-white border-4 border-black p-4 font-display-lg text-on-surface font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none btn-press uppercase tracking-widest text-black disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingUser}
                    className="flex-1 bg-[#fe00fe] text-white border-4 border-black p-4 font-display-lg font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none btn-press uppercase tracking-widest disabled:opacity-50"
                  >
                    {updatingUser ? "Saving..." : "Update"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={updatingUser}
                  className="w-full bg-error text-white border-4 border-black p-4 font-display-lg font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none btn-press uppercase tracking-widest disabled:opacity-50 hover:bg-red-700 transition-colors"
                >
                  Delete User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
