"use client";

import { useEffect, useState } from "react";

type UserRow = { id: string; email: string | null; name: string | null; role: string; createdAt?: string };

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then((data) => {
        const role = data?.user?.role;
        if (!data?.user || (role !== 'ADMIN' && role !== 'OWNER')) {
          window.location.href = '/auth/signin';
        }
      })
      .catch(() => {
        window.location.href = '/auth/signin';
      });
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load users");
      setUsers(data.users || []);
      setMessage(null);
    } catch (err: any) {
      setMessage(err.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function updateRole(id: string, role: string) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update role");
      setMessage("Role updated successfully.");
      await loadUsers();
    } catch (err: any) {
      setMessage(err.message || "Unable to update role");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600">Admin</p>
            <h1 className="mt-1 text-3xl font-bold">User management</h1>
          </div>
          <a href="/admin" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium">Back to admin</a>
        </div>

        {message && <div className="mb-4 rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-700">{message}</div>}

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">{user.email || "—"}</td>
                    <td className="py-3 pr-4">{user.name || "—"}</td>
                    <td className="py-3 pr-4">
                      <select
                        defaultValue={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        className="rounded-xl border border-slate-200 px-2 py-1.5"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="OWNER">OWNER</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4">{user.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
