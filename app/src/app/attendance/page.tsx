"use client";

import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { Staff, MonthYear } from "@/types";
import CSVUploadModal from "@/components/CSVUploadModal";

interface AttendanceLog {
  date: string;
  staffId: string;
  first_entry: string;
  last_entry: string;
  all_entries: string;
}

// Add print-specific styles
const printStyles = `
  @media print {
    @page {
      size: landscape;
      margin: 0.5cm;
    }
    body {
      margin: 0;
      padding: 0;
    }
    .no-print {
      display: none !important;
    }
    .print-table {
      width: auto !important;
      min-width: auto !important;
    }
    .print-table th,
    .print-table td {
      padding: 4px !important;
      font-size: 10px !important;
    }
    .print-table th {
      background-color: #f3f4f6 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-table tr {
      page-break-inside: avoid;
    }
    .print-table thead {
      display: table-header-group;
    }
    .print-table .sticky-columns {
      position: absolute !important;
      left: 0;
      background-color: white !important;
      z-index: 1;
    }
    .print-table .sticky-columns-header {
      position: absolute !important;
      left: 0;
      background-color: #f3f4f6 !important;
      z-index: 2;
    }
    .print-table .data-columns {
      margin-left: 120px;
    }
  }
`;

export default function AttendancePage() {
  const [selectedMonthYear, setSelectedMonthYear] = useState<MonthYear>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnsPerPage, setColumnsPerPage] = useState(15);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      const response = await fetch("/api/staff");
      const data = await response.json();
      setStaff(data);
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  }, []);

  const fetchAttendanceLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/attendance?month=${selectedMonthYear.month + 1}&year=${selectedMonthYear.year}`
      );
      const data = await response.json();
      setAttendanceLogs(data);
    } catch (error) {
      console.error("Error fetching attendance logs:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonthYear.month, selectedMonthYear.year]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchStaff();
      await fetchAttendanceLogs();
    };
    fetchData();
  }, [fetchStaff, fetchAttendanceLogs]);

  // Generate last 6 months options
  const getMonthOptions = () => {
    const options: MonthYear[] = [];
    const currentDate = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      options.push({
        month: date.getMonth(),
        year: date.getFullYear(),
      });
    }
    return options;
  };

  // Calculate pagination
  const getDatesInMonth = () => {
    const { month, year } = selectedMonthYear;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const getPageCount = () => {
    const datesInMonth = getDatesInMonth();
    return Math.ceil(datesInMonth.length / columnsPerPage);
  };

  const getTotalPages = () => {
    return getPageCount();
  };

  const getPaginatedDates = (pageIndex: number) => {
    const allDates = getDatesInMonth();
    const start = pageIndex * columnsPerPage;
    const end = Math.min(start + columnsPerPage, allDates.length);
    return allDates.slice(start, end);
  };

  // Format date to DD MMM, YYYY in IST
  const formatDate = (day: number) => {
    const { month, year } = selectedMonthYear;
    // Create date in IST (treat as local since DB is already in IST)
    const date = new Date(year, month, day);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format time to IST time string
  const formatTime = (dateString: string) => {
    // Parse the date string and create a new date in IST
    const [datePart, timePart] = dateString.split(" ");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes, seconds] = timePart.split(":").map(Number);

    // Create date in IST (treat as local since DB is already in IST)
    const date = new Date(year, month - 1, day, hours, minutes, seconds);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate time difference in minutes
  const getTimeDifference = (firstEntry: string, lastEntry: string) => {
    const [datePart1, timePart1] = firstEntry.split(" ");
    const [year1, month1, day1] = datePart1.split("-").map(Number);
    const [hours1, minutes1, seconds1] = timePart1.split(":").map(Number);

    const [datePart2, timePart2] = lastEntry.split(" ");
    const [year2, month2, day2] = datePart2.split("-").map(Number);
    const [hours2, minutes2, seconds2] = timePart2.split(":").map(Number);

    const first = new Date(year1, month1 - 1, day1, hours1, minutes1, seconds1).getTime();
    const last = new Date(year2, month2 - 1, day2, hours2, minutes2, seconds2).getTime();
    return Math.abs(last - first) / (1000 * 60); // Convert to minutes
  };

  // Get attendance record for a specific staff and date
  const getAttendanceRecord = (staffId: string, date: string) => {
    // Since DB is in IST, treat the date as local
    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return attendanceLogs.find(
      (record) => record.staffId === staffId && formatDate(new Date(record.date).getDate()) === formattedDate
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <style>{printStyles}</style>
      <div className="w-full bg-white shadow rounded-lg p-2 sm:p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Attendance Records</h1>
          <div className="flex gap-2 no-print">
            <button
              onClick={() => setIsCSVModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Upload New Records
            </button>
            <select
              value={columnsPerPage}
              onChange={(e) => setColumnsPerPage(Number(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
            >
              <option value={8}>8 columns per page</option>
              <option value={10}>10 columns per page</option>
              <option value={12}>12 columns per page</option>
              <option value={15}>15 columns per page</option>
            </select>
            <button
              onClick={handlePrint}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Print Table
            </button>
          </div>
        </div>

        {/* Month/Year Selector */}
        <div className="mb-4 no-print">
          <select
            value={`${selectedMonthYear.year}-${selectedMonthYear.month}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split("-").map(Number);
              setSelectedMonthYear({ month, year });
            }}
            className="w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
          >
            {getMonthOptions().map((option) => (
              <option key={`${option.year}-${option.month}`} value={`${option.year}-${option.month}`}>
                {new Date(option.year, option.month).toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}

        {/* Attendance Grid - Paginated for print */}
        {!loading && (
          <div className="overflow-x-auto">
            {Array.from({ length: getPageCount() }, (_, pageIndex) => (
              <div key={pageIndex} className={pageIndex > 0 ? "page-break" : ""}>
                <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm border-collapse print-table mb-10">
                  <thead>
                    <tr>
                      <th
                        colSpan={2 + getPaginatedDates(pageIndex).length}
                        className="px-2 py-3 text-left bg-gray-100 text-gray-900 font-bold"
                      >
                        {new Date(selectedMonthYear.year, selectedMonthYear.month).toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        - Page {pageIndex + 1} of {getTotalPages()}
                      </th>
                    </tr>
                    <tr className="bg-gray-50">
                      <th className="px-1 sm:px-2 py-2 text-left font-medium text-gray-700 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-1 sm:px-2 py-2 text-left font-medium text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      {getPaginatedDates(pageIndex).map((day) => (
                        <th
                          key={day}
                          className="px-1 py-2 text-center font-medium text-gray-700 uppercase tracking-wider"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staff
                      .filter((member) => member.active)
                      .map((member) => (
                        <tr key={`${pageIndex}-${member.id}`}>
                          <td className="px-1 sm:px-2 py-2 whitespace-nowrap text-gray-900">{member.id}</td>
                          <td className="px-1 sm:px-2 py-2 whitespace-nowrap text-gray-900">{member.staffName}</td>
                          {getPaginatedDates(pageIndex).map((day) => {
                            const date = formatDate(day);
                            const record = getAttendanceRecord(member.id, date);
                            return (
                              <td key={`${pageIndex}-${day}`} className="px-1 py-2 whitespace-nowrap text-center">
                                {record ? (
                                  <div className="group relative">
                                    <div className="text-xs">
                                      <div className="text-gray-900">{formatTime(record.first_entry)}</div>
                                      <div
                                        className={
                                          getTimeDifference(record.first_entry, record.last_entry) <= 5
                                            ? "text-red-700"
                                            : "text-gray-900"
                                        }
                                      >
                                        {formatTime(record.last_entry)}
                                      </div>
                                    </div>
                                    <div className="absolute z-20 hidden group-hover:block bg-white p-2 rounded shadow-lg border border-gray-200 no-print">
                                      <div className="text-xs text-gray-600">
                                        All entries for {date}:
                                        <ul className="mt-1">
                                          {record.all_entries.split(",").map((entry, index) => (
                                            <li key={index}>{formatTime(entry)}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onUploadSuccess={() => {
          setIsCSVModalOpen(false);
          fetchAttendanceLogs(); // Refresh attendance data
        }}
      />
    </Layout>
  );
}
