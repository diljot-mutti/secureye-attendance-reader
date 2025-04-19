"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import AddStaffModal from "@/components/AddStaffModal";
import EditStaffModal from "@/components/EditStaffModal";
import { Staff } from "@/types";

export default function Home() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/staff");
      const data = await response.json();
      setStaff(data);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async (newStaff: Omit<Staff, "id"> & { id: string }) => {
    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: newStaff.id,
          staffName: newStaff.staffName,
          active: newStaff.active,
        }),
      });

      if (response.ok) {
        fetchStaff(); // Refresh the staff list
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to add staff:", error);
    }
  };

  const handleUpdateStaff = async (updatedStaff: Staff) => {
    try {
      const response = await fetch("/api/staff", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedStaff),
      });

      if (response.ok) {
        fetchStaff(); // Refresh the staff list
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to update staff:", error);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      const response = await fetch(`/api/staff?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchStaff(); // Refresh the staff list
      }
    } catch (error) {
      console.error("Failed to delete staff:", error);
    }
  };

  const handleEditClick = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Add Staff
          </button>
        </div>

        {/* Staff List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{member.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{member.staffName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {member.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(member)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button disabled onClick={() => handleDeleteStaff(member.id)} className="text-grey-800">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AddStaffModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddStaff={handleAddStaff} />
        {selectedStaff && (
          <EditStaffModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedStaff(null);
            }}
            onUpdateStaff={handleUpdateStaff}
            staff={selectedStaff}
          />
        )}
      </div>
    </Layout>
  );
}
