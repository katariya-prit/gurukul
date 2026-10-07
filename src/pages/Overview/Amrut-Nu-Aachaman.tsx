import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../components/theme/ThemeContext';
import DatePicker from '../../components/common/Calendar';

// બેકએન્ડનું યુઆરએલ (તમારા સર્વર પોર્ટ મુજબ સેટ કરો)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

// બેકએન્ડ ડેટા મુજબનું ઇન્ટરફેસ
interface AmrutItem {
    _id: string; // MongoDB ની ID
    image: string; // બેકએન્ડમાં 'image' ફિલ્ડ છે
    description: string;
    date: string; // Format: YYYY-MM-DD
}

export default function AmrutNuAachaman() {
    const { theme } = useTheme();
    const isDark = theme === true;

    const today = new Date().toISOString().split('T')[0];

    const [selectedDate, setSelectedDate] = useState<string>(today);
    const [allRecords, setAllRecords] = useState<AmrutItem[]>([]); // બધો ડેટા સ્ટોર કરવા
    const [filteredData, setFilteredData] = useState<AmrutItem[]>([]); // ફિલ્ટર કરેલો ડેટા
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<AmrutItem | null>(null);

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/amrut-aachaman`);
            const result = await response.json();

            if (result.success) {
                setAllRecords(result.data);
                const todayData = result.data.filter((item: AmrutItem) => item.date === today);
                setFilteredData(todayData);
                setError(null);
            } else {
                setError(result.message || "Failed to load data");
            }
        } catch (err) {
            setError("સર્વર સાથે કનેક્ટ થઈ શક્યું નથી!");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [today]);

    useEffect(() => {
        let isMounted = true;

        const loadRecords = async () => {
            await fetchRecords();
            if (!isMounted) {
                return;
            }
        };

        void loadRecords();

        return () => {
            isMounted = false;
        };
    }, [fetchRecords]);

    // ૨. સર્ચ બટન પર ક્લિક કરવાથી તારીખ મુજબ ફિલ્ટર થશે
    const handleSearch = () => {
        const result = allRecords.filter(item => item.date === selectedDate);
        setFilteredData(result);
    };

    return (
        <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 relative transition-colors duration-300 ${isDark
                ? 'bg-slate-950 text-slate-100 selection:bg-blue-500/30'
                : 'bg-white text-slate-900 selection:bg-red-500/20'
            }`}>
            <div className="max-w-7xl mx-auto">

                {/* --- બેક બટન --- */}
                <div className="mb-6 flex justify-start">
                    <Link
                        to="/"
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border shadow-sm transition-all duration-300 transform hover:-translate-x-1.5 active:scale-95 ${isDark
                                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-blue-400 hover:border-blue-500/50 hover:shadow-blue-500/10'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-300 hover:shadow-red-500/10'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </Link>
                </div>

                {/* હેડર સેક્શન */}
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className={`text-4xl md:text-5xl font-sans font-black tracking-tight drop-shadow-sm transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-950'
                        }`}>
                        Amrut Nu Aachaman
                    </h1>
                    <div className={`h-1 w-24 mx-auto mt-4 rounded-full shadow-sm transition-colors duration-300 ${isDark ? 'bg-blue-600' : 'bg-red-600'
                        }`} />
                    <p className={`mt-3 font-sans text-sm md:text-base tracking-wide transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                        Daily divine visions and inspiring thoughts
                    </p>
                </div>

                {/* ડેટ પીકર સેક્શન */}
                <div className={`relative z-40 rounded-2xl shadow-md p-6 max-w-xl mx-auto mb-12 backdrop-blur-sm transition-all duration-300 ${isDark
                        ? 'bg-slate-900 border border-slate-800 hover:border-slate-700'
                        : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
                    }`}>
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                        <div className="relative flex-1 w-full">
                            <DatePicker
                                label="Select Date"
                                selectedValue={selectedDate}
                                onChange={(dateStr) => setSelectedDate(dateStr)}
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className={`h-10.5 px-6 font-bold rounded-xl shadow-md transition-all duration-300 transform active:scale-95 hover:-translate-y-0.5 flex items-center justify-center gap-2 group text-white ${isDark
                                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/50'
                                    : 'bg-red-600 hover:bg-red-700 shadow-red-100'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Search
                        </button>
                    </div>
                </div>

                {/* લોડિંગ અને એરર સ્ટેટસ */}
                {loading && <div className="text-center py-10 font-bold">ડેટા લોડ થઈ રહ્યો છે...</div>}
                {error && <div className="text-center text-red-500 py-10 font-bold">{error}</div>}

                {/* ડેટા ડિસ્પ્લે સેક્શન */}
                {!loading && !error && (
                    filteredData.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredData.map((item) => (
                                <div
                                    key={item._id}
                                    onClick={() => setActiveItem(item)}
                                    className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-xl flex flex-col group h-full cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 border ${isDark
                                            ? 'bg-slate-900 border-slate-800/80 hover:border-slate-700 shadow-black/40'
                                            : 'bg-white border-slate-100 hover:border-slate-200'
                                        }`}
                                >
                                    {/* ઈમેજ પાથ બેકએન્ડ URL સાથે જોડ્યો */}
                                    <div className={`relative overflow-hidden h-52 border-b ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                        <img
                                            src={`${API_URL}${item.image}`}
                                            alt="Amrut Aachaman"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                            loading="lazy"
                                        />
                                    </div>

                                    <div className={`p-5 flex-1 flex flex-col justify-between transition-colors duration-300 ${isDark
                                            ? 'bg-linear-to-b from-slate-900 to-slate-950/40'
                                            : 'bg-linear-to-b from-white to-slate-50/40'
                                        }`}>
                                        <div>
                                            <h3 className={`text-xl font-bold mb-2 line-clamp-1 transition-colors ${isDark ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-red-600'
                                                }`}>
                                                Amrut Nu Aachaman
                                            </h3>
                                            <p className={`text-sm leading-relaxed font-normal line-clamp-3 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'
                                                }`}>
                                                {item.description}
                                            </p>
                                        </div>

                                        <div className={`mt-5 pt-3 border-t-2 border-dashed flex items-center justify-between text-xs font-bold ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                                            }`}>
                                            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                                                }`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isDark ? 'text-blue-500' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 3V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                Uploaded on
                                            </span>
                                            <span className={`text-white px-2.5 py-1 rounded-md font-mono shadow-sm transition-all ${isDark ? 'bg-blue-600' : 'bg-red-600'
                                                }`}>
                                                {item.date}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`text-center py-16 rounded-2xl border-2 border-dashed max-w-lg mx-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                            }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 mx-auto mb-4 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className={`font-bold text-lg tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>No images uploaded for this date.</p>
                            <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Please select another date.</p>
                        </div>
                    )
                )}

            </div>

            {/* મોડલ પોપઅપ */}
            {activeItem && (
                <div
                    className="fixed inset-0 bg-black/75 backdrop-blur-xl z-50 flex items-center justify-center p-4 transition-all duration-300"
                    onClick={() => setActiveItem(null)}
                >
                    <div
                        className={`rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col md:flex-row transform transition-all duration-300 scale-100 relative border ${isDark ? 'bg-slate-900 border-slate-800 shadow-black/80' : 'bg-white border-slate-200'
                            }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setActiveItem(null)}
                            className={`absolute top-4 right-4 text-white rounded-full p-2 backdrop-blur-sm transition-all duration-300 shadow-md border hover:scale-110 z-10 ${isDark ? 'bg-slate-950/60 border-slate-800 hover:bg-blue-600' : 'bg-black/40 border-white/10 hover:bg-red-600'
                                }`}
                            title="Close"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className={`w-full md:w-1/2 h-64 md:h-auto min-h-80 relative ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                            <img
                                src={`${API_URL}${activeItem.image}`}
                                alt="Amrut Aachaman"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className={`w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between ${isDark ? 'bg-slate-900' : 'bg-white'
                            }`}>
                            <div>
                                <h2 className={`text-2xl md:text-3xl font-sans font-black mb-4 tracking-tight border-b pb-3 ${isDark ? 'text-white border-slate-800' : 'text-slate-950 border-slate-100'
                                    }`}>
                                    Amrut Nu Aachaman
                                </h2>
                                <p className={`text-base md:text-md leading-relaxed font-normal mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar ${isDark ? 'text-slate-300' : 'text-slate-600'
                                    }`}>
                                    {activeItem.description}
                                </p>
                            </div>

                            <div className={`pt-4 flex items-center justify-between text-sm font-bold p-3 rounded-xl border shadow-inner ${isDark
                                    ? 'border-slate-800 text-slate-300 bg-slate-950/50'
                                    : 'border-slate-200 text-slate-800 bg-slate-50'
                                }`}>
                                <span className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDark ? 'text-blue-500' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 3V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Uploaded Date
                                </span>
                                <span className={`text-white px-3 py-1.5 rounded-lg font-mono shadow-md tracking-wider ${isDark ? 'bg-blue-600' : 'bg-red-600'
                                    }`}>
                                    {activeItem.date}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}