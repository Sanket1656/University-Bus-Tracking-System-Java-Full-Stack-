import React from 'react'
import { useState, useEffect } from 'react'
import apiClient from '../../../api/apiClient';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  const [formdata, setFormdata] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "Student"
  });

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get("/auth/get-all-users");

      setUsers(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormdata({
      ...formdata,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formdata.username || !formdata.password) {
      alert("All Fields are required");
      return;
    }

    if (formdata.password !== formdata.confirmPassword) {
      alert("Password do not match");
      return;
    }

    const { confirmPassword, ...userData } = formdata;

    try {
      const res = await apiClient.post("/auth/register", userData);

      alert(res.data.message || "User Created Successfully");

      setIsEdit(false);
      fetchUsers();

    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Error");
    }
  }

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const res = await apiClient.delete(`/auth/delete-user/${userId}`);
        alert(res.data.message || "User Deleted Successfully");
        fetchUsers();
      } catch (error) {
        console.log(error);
        alert(error.response?.data?.message || "Error deleting user");
      }
    }
  }


  return (
    <div className="bg-white rounded-3xl p-6 shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Users List
        </h2>

        <button
          onClick={() => setIsEdit(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
        >
          + Add User
        </button>
      </div>

      {isEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          {/* Modal */}
          <div className="relative w-full max-w-lg rounded-3xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/30 p-8 animate-[fadeIn_.25s_ease]">

            {/* Close button */}
            <button
              onClick={() => setIsEdit(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-500 transition duration-200"
            >
              ✕
            </button>

            {/* Heading */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-800">
                Create User
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Add new admin, driver or student
              </p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>

              {/* Username */}
              <input
                type="text"
                name="username"
                value={formdata.username}
                onChange={handleChange}
                placeholder="Username"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />

              {/* Password Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="password"
                  name="password"
                  value={formdata.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />

                <input
                  type="password"
                  name="confirmPassword"
                  value={formdata.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              {/* Role */}
              <select
                name="role"
                value={formdata.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">Select Role</option>
                <option value="Admin">Admin</option>
                <option value="Driver">Driver</option>
                <option value="Student">Student</option>
              </select>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={() => setIsEdit(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:scale-[1.02] transition duration-200"
                >
                  Create User
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Username</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Phone</th>
            <th className="p-3 text-left">Role</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="border-b">
              <td className='p-3'>{user.name}</td>
              <td className='p-3'>{user.username}</td>
              <td className='p-3'>{user.email}</td>
              <td className='p-3'>{user.phone}</td>
              <td className='p-3'>{user.role}</td>

              <td className='p-3 flex gap-3'>
                <button className="bg-blue-500 text-white px-3 py-1 rounded">
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(user._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default UserList;

