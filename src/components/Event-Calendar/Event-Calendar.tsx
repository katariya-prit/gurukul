import React, { useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { eventsData } from "./event-constants";
import {
    HiChevronLeft,
    HiChevronRight,
    HiOutlineCalendar,
    HiOutlineStar,
    HiOutlineHeart,
    HiOutlineMoon
} from "react-icons/hi";

type CalendarView = "days" | "months" | "years";

type EventDetail = {
    date: string;
    title: string;
    type: 'event' | 'holiday' | 'tithi' | 'none';
};

export default function EventCalendarContent() {
    const { theme } = useTheme();
    const [view, setView] = useState<CalendarView>("days");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEventInfo, setSelectedEventInfo] = useState<EventDetail | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const [yearRangeStart, setYearRangeStart] = useState(() => Math.floor(year / 12) * 12);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentDate(new Date(year, month - 1, 1));
        setSelectedEventInfo(null);
        setSelectedDate(null);
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentDate(new Date(year, month + 1, 1));
        setSelectedEventInfo(null);
        setSelectedDate(null);
    };

    function handleDateClick(_day: number, dateStr: string, isSunday: boolean, e: React.MouseEvent) {
        e.stopPropagation();

        setSelectedDate(dateStr);

        const displayDate = new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        const eventData = eventsData[dateStr];

        if (eventData) {
            setSelectedEventInfo({
                date: displayDate,
                title: eventData.title,
                type: eventData.category
            });
        } else if (isSunday) {
            setSelectedEventInfo({ date: displayDate, title: "Sunday Holiday", type: 'holiday' });
        } else {
            setSelectedEventInfo({ date: displayDate, title: "No events planned", type: 'none' });
        }
    }

    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const yearGrid = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);

    const cellBase = "text-xs font-medium rounded-xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center relative hover:scale-[1.05]";
    const cellDefault = theme
        ? "hover:bg-slate-700/50 hover:shadow-lg hover:shadow-black/20 text-slate-300"
        : "hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 text-slate-700";

    return (
        <div className={`p-4 sm:p-6 ${theme ? "text-slate-100" : "text-slate-800"}`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
                <h4 className="text-[15px] sm:text-[17px] font-extrabold flex items-center gap-1 sm:gap-1.5 tracking-wide">
                    <button
                        onClick={() => setView("months")}
                        className={`px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-200 ${theme ? "hover:bg-slate-800 text-slate-100 hover:text-white" : "hover:bg-white hover:shadow-sm text-slate-800"
                            }`}
                    >
                        {months[month]}
                    </button>
                    <button
                        onClick={() => { setYearRangeStart(Math.floor(year / 12) * 12); setView("years"); }}
                        className={`px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-200 ${theme ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        {year}
                    </button>
                </h4>
                {view === "days" && (
                    <div className="flex space-x-1 sm:space-x-2">
                        <button onClick={handlePrevMonth} className={`p-1.5 sm:p-2 rounded-xl border transition-all duration-200 ${theme ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm"
                            }`}>
                            <HiChevronLeft className="text-lg" />
                        </button>
                        <button onClick={handleNextMonth} className={`p-1.5 sm:p-2 rounded-xl border transition-all duration-200 ${theme ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm"
                            }`}>
                            <HiChevronRight className="text-lg" />
                        </button>
                    </div>
                )}
            </div>

            {view === "days" && (
                <div className="animate-fade-in">
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2 sm:mb-3">
                        {daysOfWeek.map((d) => (
                            <div key={d} className={`text-[11px] sm:text-[12px] font-black tracking-widest uppercase py-1 ${d === "Su" ? "text-red-500/90" : (theme ? "text-slate-500" : "text-slate-400")
                                }`}>
                                {d}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
                        {blanks.map((_, idx) => <div key={`blank-${idx}`} className="py-1 sm:py-2"></div>)}

                        {days.map((day) => {
                            const dateObj = new Date(year, month, day);
                            const formattedMonth = String(month + 1).padStart(2, "0");
                            const formattedDay = String(day).padStart(2, "0");
                            const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

                            const isSunday = dateObj.getDay() === 0;
                            const isToday = new Date().toDateString() === dateObj.toDateString();
                            const isSelected = selectedDate === dateStr;

                            const eventObj = eventsData[dateStr];
                            const hasTithi = eventObj?.category === 'tithi';
                            const hasEvent = eventObj?.category === 'event';

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={(e) => handleDateClick(day, dateStr, isSunday, e)}
                                    className={`py-1 sm:py-2 h-10 sm:h-12 ${cellBase} ${cellDefault} ${isToday
                                        ? (theme ? 'bg-blue-500/10 border border-blue-500/30 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-blue-50 border border-blue-200 text-blue-700 shadow-sm')
                                        : isSelected
                                            ? (theme ? 'border border-slate-500 bg-slate-700/40 text-slate-100' : 'border border-slate-400 bg-slate-100 text-slate-800 shadow-sm')
                                            : 'border border-transparent'
                                        }`}
                                >
                                    <span className={`text-[13px] sm:text-[14px] ${isSunday ? "text-red-500 font-bold" : (isToday ? "font-extrabold" : (isSelected ? "font-bold" : "font-medium"))}`}>
                                        {day}
                                    </span>

                                    <div className="flex gap-1 mt-0.5 sm:mt-1 h-1 sm:h-1.5">
                                        {isSunday && <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></div>}
                                        {hasTithi && <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></div>}
                                        {hasEvent && <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]"></div>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {selectedEventInfo && (
                        <div className={`relative overflow-hidden mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-500 transform scale-100 opacity-100 ${theme
                            ? "bg-linear-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 shadow-inner shadow-white/5"
                            : "bg-linear-to-br from-white to-slate-50/80 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
                            }`}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 ${selectedEventInfo.type === 'event' ? "bg-linear-to-b from-blue-400 to-indigo-600" :
                                selectedEventInfo.type === 'tithi' ? "bg-linear-to-b from-emerald-400 to-teal-600" :
                                    selectedEventInfo.type === 'holiday' ? "bg-linear-to-b from-red-400 to-rose-600" :
                                        (theme ? "bg-linear-to-b from-slate-600 to-slate-700" : "bg-linear-to-b from-slate-300 to-slate-400")
                                }`}></div>

                            <div className="flex items-center gap-3 sm:gap-4 pl-2">
                                <div className={`shrink-0 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm ${selectedEventInfo.type === 'event'
                                    ? (theme ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20" : "bg-blue-50 text-blue-600 ring-1 ring-blue-100")
                                    : selectedEventInfo.type === 'tithi'
                                        ? (theme ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100")
                                        : selectedEventInfo.type === 'holiday'
                                            ? (theme ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/20" : "bg-rose-50 text-rose-600 ring-1 ring-rose-100")
                                            : (theme ? "bg-slate-800 text-slate-400 ring-1 ring-slate-700" : "bg-slate-100 text-slate-500 ring-1 ring-slate-200")
                                    }`}>
                                    {selectedEventInfo.type === 'event' && <HiOutlineStar className="text-xl sm:text-2xl" />}
                                    {selectedEventInfo.type === 'tithi' && <HiOutlineMoon className="text-xl sm:text-2xl" />}
                                    {selectedEventInfo.type === 'holiday' && <HiOutlineHeart className="text-xl sm:text-2xl" />}
                                    {selectedEventInfo.type === 'none' && <HiOutlineCalendar className="text-xl sm:text-2xl" />}
                                </div>

                                <div className="flex-1">
                                    <p className={`text-[10px] sm:text-[11px] font-black tracking-widest uppercase mb-0.5 sm:mb-1 ${theme ? "text-slate-400" : "text-slate-400"}`}>
                                        {selectedEventInfo.date}
                                    </p>
                                    <h5 className={`text-[14px] sm:text-[16px] font-extrabold leading-tight tracking-tight ${theme ? "text-slate-200" : "text-slate-800"}`}>
                                        {selectedEventInfo.title}
                                    </h5>

                                    {selectedEventInfo.type === 'event' && (
                                        <p className={`text-[11px] sm:text-[12px] mt-0.5 sm:mt-1 font-medium ${theme ? "text-blue-300/70" : "text-slate-500"}`}>
                                            Grand festival & celebration day.
                                        </p>
                                    )}
                                    {selectedEventInfo.type === 'tithi' && (
                                        <p className={`text-[11px] sm:text-[12px] mt-0.5 sm:mt-1 font-medium ${theme ? "text-emerald-300/70" : "text-slate-500"}`}>
                                            Auspicious day in the Hindu calendar.
                                        </p>
                                    )}
                                    {selectedEventInfo.type === 'holiday' && (
                                        <p className={`text-[11px] sm:text-[12px] mt-0.5 sm:mt-1 font-medium ${theme ? "text-red-300/70" : "text-slate-500"}`}>
                                            Weekly day off. Rejuvenate your mind.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view === "months" && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-fade-in">
                    {monthsShort.map((m, idx) => (
                        <button key={m} onClick={() => { setCurrentDate(new Date(year, idx, 1)); setView("days"); }} className={`py-4 sm:py-5 ${cellBase} ${cellDefault}`}>
                            <span className="text-[14px] sm:text-[15px] font-bold">{m}</span>
                        </button>
                    ))}
                </div>
            )}

            {view === "years" && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-fade-in">
                    {yearGrid.map((y) => (
                        <button key={y} onClick={() => { setCurrentDate(new Date(y, month, 1)); setView("months"); }} className={`py-4 sm:py-5 ${cellBase} ${cellDefault}`}>
                            <span className="text-[14px] sm:text-[15px] font-bold">{y}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}