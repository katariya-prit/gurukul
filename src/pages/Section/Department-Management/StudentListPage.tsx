import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTheme } from "../../../components/theme/ThemeContext";
import Table from "../../../components/common/Table";
import { HiOutlineUserGroup, HiSearch, HiFilter, HiChevronDown } from "react-icons/hi";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

// Backend have camelCase mokle che (departmentId, sectionId, roleCode)
interface Student {
  suid: string;
  name: string;
  username: string;
  roleCode: string;
  departmentId: number;
  sectionId: number;
  standardId?: number;
}

export default function StudentListPage() {
  const { theme } = useTheme();

  const { deptId, sectionId } = useParams<{ deptId: string; sectionId: string }>();
  const currentDeptId = Number(deptId);
  const currentSectionId = sectionId ? Number(sectionId) : null;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Sirf is section na students j fetch karo (badha /users nahi)
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);

        const url = currentSectionId
          ? `${API_URL}/users/section/${currentSectionId}`
          : `${API_URL}/users`;

        console.log("🔍 Fetching from:", url); // 🎯 DEBUG

        // 🎯 FIX: /users/* routes auth-protected chhe, token header vagar 401 "Unauthorized access" aave chhe
        const token = localStorage.getItem("token");
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();

        console.log("📦 Response:", json); // 🎯 DEBUG

        if (!res.ok) {
          throw new Error(json?.message || "Failed to load students.");
        }

        const students: Student[] = json.data || [];
        setAllStudents(students);
      } catch (error) {
        console.error("❌ Error:", error); // 🎯 DEBUG
        toast.error(error instanceof Error ? error.message : "Failed to load students.");
      } finally {
        setLoading(false);
      }
    };

    if (currentSectionId) {
      fetchStudents();
    }
  }, [currentSectionId]);

  // department_id nahi, departmentId (camelCase) — ane already section-specific API vaparyu che
  const deptFilteredStudents = allStudents.filter((s) => s.departmentId === currentDeptId);

  const filterOptions = [
    { label: "All Fields", value: "all" },
    { label: "Name", value: "name" },
    { label: "SUID", value: "suid" },
    { label: "Username", value: "username" },
    { label: "Role", value: "roleCode" },
  ];

  const getSearchInputConfig = () => {
    switch (filterType) {
      case "suid":
        return { type: "text", placeholder: "Enter SUID..." };
      case "username":
        return { type: "text", placeholder: "Search Username" };
      case "roleCode":
        return { type: "text", placeholder: "Search Role" };
      case "name":
        return { type: "text", placeholder: "Search Name" };
      default:
        return { type: "text", placeholder: "Search Across All Records" };
    }
  };

  const inputConfig = getSearchInputConfig();

  const finalTableData = deptFilteredStudents.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    switch (filterType) {
      case "name":
        return s.name?.toLowerCase().includes(query);
      case "suid":
        return String(s.suid).toLowerCase().includes(query);
      case "username":
        return s.username?.toLowerCase().includes(query);
      case "roleCode":
        return s.roleCode?.toLowerCase().startsWith(query);
      default:
        return (
          s.name?.toLowerCase().includes(query) ||
          String(s.suid).toLowerCase().includes(query) ||
          s.username?.toLowerCase().includes(query) ||
          s.roleCode?.toLowerCase().startsWith(query)
        );
    }
  });

  const totalStudents = deptFilteredStudents.length;

  const columns = [
    {
      header: "SUID",
      className: "w-32 text-center font-mono font-bold",
      accessor: (student: Student) => student.suid,
    },
    {
      header: "Full Name",
      className: "text-left font-semibold",
      accessor: (student: Student) => student.name,
    },
    {
      header: "Username",
      className: "text-left font-mono text-xs",
      accessor: (student: Student) => `@${student.username}`,
    },
    {
      header: "Role",
      className: "text-center",
      accessor: (student: Student) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            student.roleCode === "STUDENT"
              ? theme
                ? "bg-emerald-950/30 text-emerald-400"
                : "bg-green-100 text-green-700"
              : theme
                ? "bg-purple-950/30 text-purple-400"
                : "bg-purple-100 text-purple-700"
          }`}
        >
          {student.roleCode || "N/A"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-full mx-auto">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

        <div className="flex items-center gap-3">
          <span
            className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-colors ${
              theme ? "bg-blue-500/10 text-blue-300" : "bg-[#9b001c]/10 text-[#9b001c]"
            }`}
          >
            <HiOutlineUserGroup size={20} />
          </span>
          <div>
            <h2 className={`text-xl font-bold leading-tight ${theme ? "text-blue-100" : "text-[#9b001c]"}`}>
              Official Student Roster
            </h2>
            <p className={`text-xs mt-0.5 ${theme ? "text-gray-500" : "text-neutral-400"}`}>
              {loading
                ? "Loading students..."
                : `Showing ${finalTableData.length} of ${totalStudents} students · Section #${currentSectionId}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-1">

          <div className="relative group">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center justify-between pl-9 pr-3 py-2.5 w-36 sm:w-40 rounded-xl border text-sm font-medium outline-none transition-all duration-300 ${
                theme
                  ? "bg-gray-800/60 border-gray-700 text-gray-200 focus:ring-2 focus:ring-blue-500/50 hover:border-gray-600 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)]"
                  : "bg-white border-gray-200/80 text-gray-700 focus:ring-2 focus:ring-[#9b001c]/20 hover:border-gray-300 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
              }`}
            >
              <div
                className={`absolute left-3 flex items-center pointer-events-none transition-colors ${
                  theme ? "text-gray-400 group-hover:text-blue-400" : "text-gray-500 group-hover:text-[#9b001c]"
                }`}
              >
                <HiFilter className="w-4 h-4" />
              </div>
              <span className="truncate mr-2">
                {filterOptions.find((opt) => opt.value === filterType)?.label}
              </span>
              <HiChevronDown
                className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isFilterOpen ? "rotate-180" : ""} ${
                  theme ? "text-gray-400" : "text-gray-500"
                }`}
              />
            </button>

            {isFilterOpen && (
              <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
            )}

            {isFilterOpen && (
              <div
                className={`absolute right-0 z-20 mt-2 w-44 rounded-xl border py-1.5 shadow-xl backdrop-blur-md transform transition-all duration-200 origin-top-right ${
                  theme
                    ? "bg-gray-800/95 border-gray-700 text-gray-200 shadow-black/40"
                    : "bg-white/95 border-gray-100 text-gray-700 shadow-gray-200/50"
                }`}
              >
                {filterOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      setFilterType(option.value);
                      setSearchQuery("");
                      setIsFilterOpen(false);
                    }}
                    className={`px-4 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                      filterType === option.value
                        ? theme
                          ? "bg-blue-500/10 text-blue-400 font-bold"
                          : "bg-[#9b001c]/5 text-[#9b001c] font-bold"
                        : theme
                          ? "hover:bg-gray-700/50"
                          : "hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                    {filterType === option.value && (
                      <span className={`w-1.5 h-1.5 rounded-full ${theme ? "bg-blue-400" : "bg-[#9b001c]"}`}></span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative group">
            <div
              className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                theme ? "text-gray-400 group-focus-within:text-blue-400" : "text-gray-400 group-focus-within:text-[#9b001c]"
              }`}
            >
              <HiSearch className="w-4 h-4" />
            </div>
            <input
              type={inputConfig.type}
              placeholder={inputConfig.placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2.5 w-full sm:w-48 lg:w-64 xl:w-72 rounded-xl border text-sm outline-none transition-all duration-300 ease-in-out focus:w-full sm:focus:w-56 lg:focus:w-72 xl:focus:w-80 ${
                theme
                  ? "bg-gray-800/60 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 hover:border-gray-600 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)]"
                  : "bg-white border-gray-200/80 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#9b001c]/20 focus:border-[#9b001c] hover:border-gray-300 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
              }`}
            />
          </div>

        </div>
      </div>

      <div
        className={`rounded-2xl border shadow-sm overflow-hidden p-2 ${
          theme ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
        }`}
      >
        <Table
          columns={columns}
          data={finalTableData}
          keyExtractor={(student) => student.suid}
          emptyMessage={
            loading
              ? "Loading students..."
              : searchQuery
              ? `No student matches "${searchQuery}"`
              : "No registered students found in this section yet."
          }
        />
      </div>

    </div>
  );
}