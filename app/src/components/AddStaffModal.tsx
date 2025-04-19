import { useState } from "react";
import { Staff } from "@/types";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStaff: (staff: Omit<Staff, "id"> & { id: string }) => void;
}

export default function AddStaffModal({ isOpen, onClose, onAddStaff }: AddStaffModalProps) {
  const [formData, setFormData] = useState<Omit<Staff, "id">>({
    staffName: "",
    active: true,
  });
  const [id, setId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const validateName = (name: string): string | null => {
    if (!name.trim()) return "Please enter the staff member's full name";
    if (name.length < 2) return "Name must be at least 2 characters long";
    if (name.length > 50) return "Name must be less than 50 characters";
    if (!/^[a-zA-Z\s\-']+$/.test(name)) return "Name can only contain letters, spaces, hyphens, and apostrophes";
    return null;
  };

  const validateId = (id: string): string | null => {
    if (!id.trim()) return "Please enter a unique staff ID";
    if (!/^\d+$/.test(id)) return "Staff ID must be a number";
    if (id.length > 10) return "Staff ID must be less than 10 digits";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotification(null);

    const nameError = validateName(formData.staffName);
    const idError = validateId(id);

    if (nameError || idError) {
      setError(nameError || idError || "");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          staffName: formData.staffName,
          active: formData.active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add staff member");
      }

      setNotification({ type: "success", message: "Staff member added successfully!" });
      onAddStaff({ id, ...formData });
      setFormData({ staffName: "", active: true });
      setId("");
      setTimeout(() => {
        onClose();
        setNotification(null);
      }, 2000);
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to add staff member. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Add New Staff Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-900 text-sm font-bold mb-2" htmlFor="id">
              Staff ID
            </label>
            <input
              id="id"
              type="number"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              placeholder="Enter unique staff identification number"
              disabled={isLoading}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-900 text-sm font-bold mb-2" htmlFor="staffName">
              Full Name
            </label>
            <input
              id="staffName"
              type="text"
              value={formData.staffName}
              onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              placeholder="Enter the staff member's full name"
              disabled={isLoading}
              required
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          <div className="mb-6">
            <label className="block text-gray-900 text-sm font-bold mb-2" htmlFor="active">
              Employment Status
            </label>
            <select
              id="active"
              value={formData.active ? "true" : "false"}
              onChange={(e) => setFormData({ ...formData, active: e.target.value === "true" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              disabled={isLoading}
            >
              <option value="true">Currently Active</option>
              <option value="false">Currently Inactive</option>
            </select>
          </div>

          {notification && (
            <div
              className={`mb-4 p-3 rounded-md text-sm ${
                notification.type === "success" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"
              }`}
            >
              {notification.message}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-900 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 relative"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="opacity-0">Add Staff</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </>
              ) : (
                "Add Staff Member"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
