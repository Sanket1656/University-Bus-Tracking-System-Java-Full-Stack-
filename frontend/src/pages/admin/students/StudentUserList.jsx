import React from 'react'
import { useState, useEffect } from 'react';
import apiClient from '../../../api/apiClient';

const StudentUserList = () => {

    const [users, setUsers] = useState([]);

    const fetchUsers = async () => {

        try {
            const response = await apiClient.get("/auth/get-all-students");

            setUsers(response.data);
            console.log(response.data);
            
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);



    return (
        <div className="bg-white rounded-3xl p-6 shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Student Users</h2>
            </div>

            <table className="w-full border-collapse">
                <thead >
                    <tr className="bg-slate-100">
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Email</th>
                        <th className="p-3 text-left">Phone</th>
                        <th className="p-3 text-left">Branch</th>
                        <th className="p-3 text-left">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {users.map((user) => (
                        <tr key={user._id} className="border-b">
                            <td className="p-3">{user.name}</td>
                            <td className="p-3">{user.email || "N/A"}</td>
                            <td className="p-3">{user.phone || "N/A"}</td>
                            <td className="p-3">{user.branch || "N/A"}</td>


                            <td className=" flex gap-3 p-3">
                                <button className="bg-blue-500 text-white px-3 py-1 rounded">Edit</button>
                                <button className="bg-green-500 text-white px-3 py-1 rounded">View</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default StudentUserList