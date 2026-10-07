import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../components/theme/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

// 🎯 FIX: Backend DTO sathe exact match — camelCase
interface DarshanData {
  id: number;
  title: string;
  imageUrl: string;
  description: string;
  date: string;
}

const DailyDarshan: React.FC = () => {
  const { theme } = useTheme();

  const [darshanItems, setDarshanItems] = useState<DarshanData[]>([]);
  const [selectedDarshan, setSelectedDarshan] = useState<DarshanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const date = today.getDate();
  const month = today.toLocaleString('default', { month: 'short' });
  const day = today.toLocaleString('default', { weekday: 'long' });
  const year = today.getFullYear();
  const todayISO = today.toISOString().split('T')[0];

  // 🎯 FIX: mock data hatavi ne real backend fetch — /daily-darshan thi badhi entries mangavi,
  // pachi aaje ni date wali j batavi (Amrut Nu Aachaman ni j pattern)
  const fetchDarshan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/daily-darshan`, { cache: "no-store" });
      const result = await res.json();

      if (result.success) {
        const todayItems = (result.data as DarshanData[]).filter((item) => item.date === todayISO);
        setDarshanItems(todayItems);
        setError(null);
      } else {
        setError(result.message || "Failed to load darshan");
      }
    } catch (err) {
      setError("સર્વર સાથે કનેક્ટ થઈ શક્યું નથી!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [todayISO]);

  useEffect(() => {
    fetchDarshan();
  }, [fetchDarshan]);

  const closeModal = () => {
    setSelectedDarshan(null);
  };

  return (
    <div className={`w-full h-screen overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none p-6 md:p-12 font-sans relative transition-colors duration-300 ${theme ? "bg-[#0B1120]" : "bg-linear-to-br from-slate-50 to-slate-100"
      }`}>

      {/* 0. LUXURY BACK BUTTON */}
      <div className="mb-6 flex items-start">
        <Link
          to="/"
          className={`group inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full font-bold text-sm backdrop-blur-md border shadow-sm transition-all duration-300 ease-out active:scale-95 ${theme
              ? "bg-[#151D2F]/80 text-slate-300 border-slate-700 hover:text-blue-400 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20"
              : "bg-white/80 text-slate-700 border-slate-200 hover:text-red-600 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/15"
            }`}
        >
          <svg
            className="w-4 h-4 transform transition-transform duration-300 group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
      </div>

      {/* 1. ULTRA-PREMIUM HEADER */}
      <div className="text-center pt-2 mb-8">
        <h1 className={`text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text drop-shadow-sm mb-4 tracking-tight ${theme ? "bg-linear-to-r from-white via-blue-400 to-slate-400" : "bg-linear-to-r from-black via-slate-700 to-red-600"
          }`}>
          Daily Darshan
        </h1>
        <div className={`h-1.5 w-32 mx-auto rounded-full shadow-lg ${theme ? "bg-linear-to-r from-blue-500 to-white shadow-blue-500/20" : "bg-linear-to-r from-red-600 to-slate-800 shadow-red-500/20"
          }`}></div>
        <p className={`mt-4 font-medium tracking-wide text-lg ${theme ? "text-slate-400" : "text-slate-600"
          }`}>
          Today's divine darshan of Shree Swaminarayan Bhagwan and Ghanshyam Ji.
        </p>
      </div>

      {/* 2. CURRENT DATE SECTION */}
      <div className="flex justify-end mb-12">
        <div className={`backdrop-blur-md rounded-2xl p-4 flex gap-5 items-center transform hover:scale-105 transition-all duration-300 ease-out cursor-default relative overflow-hidden ${theme ? "bg-[#151D2F]/90 shadow-xl shadow-black/50 border border-slate-700/50" : "bg-white/80 shadow-xl shadow-slate-200 border border-slate-200"
          }`}>
          <div className={`absolute top-0 left-0 w-full h-1 opacity-80 ${theme ? "bg-linear-to-r from-blue-500 to-slate-400" : "bg-linear-to-r from-black to-red-600"
            }`}></div>

          <div className={`flex flex-col items-center justify-center border-r-2 pr-5 ${theme ? "border-slate-700" : "border-slate-200"
            }`}>
            <span className={`text-4xl font-black bg-clip-text text-transparent leading-none ${theme ? "bg-linear-to-b from-white to-blue-400" : "bg-linear-to-b from-black to-red-600"
              }`}>
              {date}
            </span>
            <span className={`text-sm font-bold uppercase tracking-widest mt-1 ${theme ? "text-slate-400" : "text-slate-500"
              }`}>
              {month}
            </span>
          </div>

          <div className="flex flex-col items-start pl-1">
            <span className={`text-lg font-bold tracking-wide ${theme ? "text-slate-200" : "text-slate-800"
              }`}>
              {day}
            </span>
            <span className={`text-sm font-medium ${theme ? "text-slate-500" : "text-slate-400"
              }`}>
              {year}
            </span>
          </div>
        </div>
      </div>

      {/* 3. LOADING / ERROR STATES */}
      {loading && (
        <div className="text-center py-10 font-bold">
          <p className={theme ? "text-slate-400" : "text-slate-500"}>Loading darshan...</p>
        </div>
      )}
      {error && !loading && (
        <div className="text-center text-red-500 py-10 font-bold">{error}</div>
      )}

      {/* 4. DYNAMIC IMAGES & DESCRIPTION BOXES */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {darshanItems.length > 0 ? (
            darshanItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedDarshan(item)}
                className={`group cursor-pointer relative rounded-3xl transition-all duration-500 overflow-hidden flex flex-col transform hover:-translate-y-2 ${theme ? "bg-[#151D2F] shadow-lg shadow-black/50 border border-slate-800 hover:border-blue-500/50" : "bg-white shadow-lg hover:shadow-2xl hover:shadow-red-500/10 border border-slate-100 hover:border-red-400"
                  }`}
              >
                <div className="relative h-72 overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-white/30 backdrop-blur-md text-white px-6 py-2 rounded-full font-medium tracking-wide border border-white/50 shadow-lg">
                      Divine Darshan
                    </span>
                  </div>
                </div>

                <div className={`p-8 flex-1 flex flex-col justify-start bg-linear-to-b ${theme ? "from-[#151D2F] to-[#0B1120]" : "from-white to-slate-50"
                  }`}>
                  <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${theme ? "text-slate-200 group-hover:text-blue-400" : "text-slate-800 group-hover:text-red-600"
                    }`}>
                    {item.title}
                  </h3>
                  <p className={`leading-relaxed font-medium line-clamp-2 ${theme ? "text-slate-400" : "text-slate-600"
                    }`}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20">
              <p className={`text-2xl font-semibold ${theme ? "text-slate-500" : "text-slate-400"}`}>
                Today's darshan is not available yet. Please check back later for divine blessings.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. LUXURY POPUP MODAL */}
      {selectedDarshan && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl transition-opacity ${theme ? "bg-black/80" : "bg-black/60"
            }`}
          onClick={closeModal}
        >
          <div
            className={`relative rounded-4xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row transform scale-100 ${theme ? "bg-[#151D2F] shadow-2xl shadow-black/80 border border-slate-700" : "bg-white shadow-2xl shadow-slate-900/20 border border-slate-200"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedDarshan(null)}
              className={`absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 backdrop-blur-md shadow-md cursor-pointer hover:scale-110 active:scale-95 ${theme
                ? "bg-slate-800/80 text-slate-200 hover:bg-slate-600 hover:text-white border border-white/10"
                : "bg-white/90 text-slate-800 hover:bg-red-500 hover:text-white border border-slate-200"
                }`}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="md:w-1/2 h-80 md:h-150 relative">
              <img
                src={selectedDarshan.imageUrl}
                alt={selectedDarshan.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-r from-transparent to-black/10"></div>
            </div>

            <div className={`md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative ${theme ? "bg-[#151D2F]" : "bg-linear-to-br from-white via-slate-50 to-red-50/20"
              }`}>

              <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-10 bg-linear-to-bl ${theme ? "from-blue-500/10" : "from-red-500/10"
                }`}></div>

              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text mb-6 leading-tight ${theme ? "bg-linear-to-r from-white to-blue-400" : "bg-linear-to-r from-black to-red-600"
                }`}>
                {selectedDarshan.title}
              </h2>

              <div className={`w-16 h-1 rounded-full mb-8 ${theme ? "bg-linear-to-r from-blue-500 to-slate-400" : "bg-linear-to-r from-black to-red-600"
                }`}></div>

              <p className={`text-lg md:text-xl leading-relaxed font-medium ${theme ? "text-slate-300" : "text-slate-700"
                }`}>
                {selectedDarshan.description}
              </p>

              <p className={`mt-10 text-sm font-bold uppercase tracking-widest ${theme ? "text-blue-400" : "text-red-600"
                }`}>
                Swaminarayan Gurukul - Bhayavadar
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DailyDarshan;