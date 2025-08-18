"use client";

import { useState, useRef } from "react";

interface CSVRecord {
  userId: string;
  timestamp: string;
  verifyMode: string;
}

interface UploadResult {
  message: string;
  totalRecords: number;
  uniqueAfterClientDedupe: number;
  newRecordsInserted: number;
  skippedAsClientDuplicates: number;
  skippedAsExistingInDb: number;
}

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function CSVUploadModal({ isOpen, onClose, onUploadSuccess }: CSVUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<CSVRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (csvText: string): CSVRecord[] => {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    // Find the correct column indices
    const userIdIndex = headers.findIndex(
      (h) => h.toLowerCase().includes("user id") || h.toLowerCase().includes("userid")
    );
    const timestampIndex = headers.findIndex((h) => h.toLowerCase().includes("timestamp"));
    const verifyModeIndex = headers.findIndex(
      (h) => h.toLowerCase().includes("verify mode") || h.toLowerCase().includes("verifymode")
    );

    if (userIdIndex === -1 || timestampIndex === -1) {
      throw new Error('CSV must contain "User ID" and "Timestamp" columns');
    }

    const records: CSVRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim()) {
        const values = line.split(",").map((v) => v.trim());
        records.push({
          userId: values[userIdIndex],
          timestamp: values[timestampIndex],
          verifyMode: verifyModeIndex !== -1 ? values[verifyModeIndex] : "",
        });
      }
    }

    return records;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setUploadResult(null);
      setPreviewData([]);

      const text = await file.text();
      const records = parseCSV(text);

      if (records.length === 0) {
        setError("No valid records found in CSV");
        return;
      }

      setPreviewData(records.slice(0, 5)); // Show first 5 records as preview
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file");
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const file = fileInputRef.current.files[0];
      const text = await file.text();
      const records = parseCSV(text);

      const response = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setUploadResult(result);
      onUploadSuccess();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setUploadResult(null);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Upload New Attendance Records</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">CSV Format Requirements:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • CSV must contain columns: <strong>User ID</strong>, <strong>Timestamp</strong> (Verify Mode is
                optional and ignored)
              </li>
              <li>
                • <strong>User ID</strong>: Staff member identifier
              </li>
              <li>
                • <strong>Timestamp</strong>: Date and time in format YYYY-MM-DD HH:MM:SS
              </li>
              <li>• Duplicates are removed by the system (exact same User ID + Timestamp)</li>
            </ul>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 records):</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-2">
                  <span className="font-medium">User ID</span> | <span className="font-medium">Timestamp</span>
                </div>
                {previewData.map((record, index) => (
                  <div key={index} className="text-xs text-gray-800 mb-1">
                    {record.userId} | {record.timestamp}
                  </div>
                ))}
                {previewData.length === 5 && (
                  <div className="text-xs text-gray-500 italic">... and {previewData.length - 5} more records</div>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Success Result */}
          {uploadResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Upload Successful!</h3>
              <div className="text-sm text-green-800 space-y-1">
                <p>Total records received: {uploadResult.totalRecords}</p>
                <p>Unique after client-side dedupe: {uploadResult.uniqueAfterClientDedupe}</p>
                <p>Inserted into database: {uploadResult.newRecordsInserted}</p>
                <p>Skipped as client duplicates: {uploadResult.skippedAsClientDuplicates}</p>
                <p>Skipped as existing in DB: {uploadResult.skippedAsExistingInDb}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || previewData.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Upload Records"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
