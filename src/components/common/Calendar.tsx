import { useState, useRef, useEffect } from "react";
import { useTheme } from "../theme/ThemeContext";
import { HiCalendar, HiChevronLeft, HiChevronRight } from "react-icons/hi"; // અથવા 'react-icons/hi'
import { Popover } from "../overlay/OverlayPrimitives";

interface DatePickerProps {
  label: string;
  selectedValue: string;
  onChange: (dateStr: string) => void;
  required?: boolean;
}

// કેલેન્ડર ત્રણ "view" વચ્ચે switch થાય છે:
// - "days"   : રોજિંદો દિવસોનો ગ્રિડ (ડિફોલ્ટ)
// - "months" : જાન્યુઆરી-ડિસેમ્બરનો ગ્રિડ, મહિનો પસંદ કરવા માટે
// - "years"  : વર્ષોનો ગ્રિડ (12 વર્ષ એક સાથે), વર્ષ પસંદ કરવા માટે
type CalendarView = "days" | "months" | "years";

export default function DatePicker({
  label,
  selectedValue,
  onChange,
  required = false,
}: DatePickerProps) {
  const { theme } = useTheme(); // true = Dark, false = Light
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<CalendarView>("days");

  // શરૂઆતની તારીખ સેટ કરવા માટે
  const initialDate = selectedValue ? new Date(selectedValue) : new Date();
  const [currentDate, setCurrentDate] = useState(initialDate);

  // years ગ્રિડ કયા દાયકાથી શરૂ થાય છે તે ટ્રૅક કરે છે (દા.ત. 2020 એટલે 2020-2031)
  const [yearRangeStart, setYearRangeStart] = useState(
    () => Math.floor(initialDate.getFullYear() / 12) * 12
  );

  const triggerRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthsShort = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // અગાઉના અને આગામી મહિના માટે (days view માં)
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // અગાઉના અને આગામી દાયકા માટે (years view માં)
  const handlePrevYearRange = (e: React.MouseEvent) => {
    e.stopPropagation();
    setYearRangeStart((y) => y - 12);
  };

  const handleNextYearRange = (e: React.MouseEvent) => {
    e.stopPropagation();
    setYearRangeStart((y) => y + 12);
  };

  // હેડર પર મહિનાનું નામ ક્લિક કરતાં months view ખુલે
  const handleMonthLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setView("months");
  };

  // હેડર પર વર્ષ ક્લિક કરતાં years view ખુલે
  const handleYearLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setYearRangeStart(Math.floor(year / 12) * 12);
    setView("years");
  };

  // months grid માંથી મહિનો પસંદ કરતાં days view પર પાછા જાય
  const handleMonthSelect = (monthIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, monthIndex, 1));
    setView("days");
  };

  // years grid માંથી વર્ષ પસંદ કરતાં months view પર જાય
  // (વર્ષ પસંદ કર્યા પછી મહિનો પસંદ કરવો કુદરતી ફ્લો છે)
  const handleYearSelect = (selectedYear: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(selectedYear, month, 1));
    setView("months");
  };

  // તારીખ સિલેક્ટ થાય ત્યારે
  const handleDateClick = (day: number, e: React.MouseEvent) => {
    e.stopPropagation();

    // મહિનો અને દિવસ હંમેશા ૨ આંકડામાં આવે (MM-DD) તે માટે ફોર્મેટિંગ
    const formattedMonth = String(month + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateString = `${year}-${formattedMonth}-${formattedDay}`;

    onChange(dateString); // મેઈન ફોર્મ સ્ટેટને ડેટા મોકલશે
    setIsOpen(false); // કેલેન્ડર બંધ કરશે
  };

  // કેલેન્ડર ખુલે ત્યારે હંમેશા days view થી શરૂ થાય
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView("days");
      setYearRangeStart(Math.floor(year / 12) * 12);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // આજની તારીખ હાઇલાઇટ કરવા માટે
  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  // સિલેક્ટ કરેલી તારીખ હાઇલાઇટ કરવા માટે
  const isSelected = (day: number) => {
    if (!selectedValue) return false;
    const selDate = new Date(selectedValue);
    return selDate.getDate() === day && selDate.getMonth() === month && selDate.getFullYear() === year;
  };

  const isCurrentMonth = (monthIndex: number) => {
    const today = new Date();
    return today.getMonth() === monthIndex && today.getFullYear() === year;
  };

  const isSelectedMonth = (monthIndex: number) => {
    if (!selectedValue) return false;
    const selDate = new Date(selectedValue);
    return selDate.getMonth() === monthIndex && selDate.getFullYear() === year;
  };

  const isCurrentYear = (y: number) => new Date().getFullYear() === y;

  const isSelectedYear = (y: number) => {
    if (!selectedValue) return false;
    return new Date(selectedValue).getFullYear() === y;
  };

  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const yearGrid = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);

  // ડિસ્પ્લે માટે તારીખનું ફોર્મેટ સાદું કરવા (DD/MM/YYYY)
  const getDisplayDate = () => {
    if (!selectedValue) return "";
    const [y, m, d] = selectedValue.split("-");
    return `${d}/${m}/${y}`;
  };

  // ત્રણેય view માટે common cell સ્ટાઇલ classes
  const cellBase =
    "text-xs font-medium rounded-lg transition cursor-pointer flex items-center justify-center";
  const cellSelected = theme
    ? "bg-blue-600 text-white font-bold"
    : "bg-red-500 text-white font-bold";
  const cellCurrent = theme
    ? "bg-gray-700 border border-blue-400 text-blue-200"
    : "bg-red-50 border border-red-400 text-red-600";
  const cellDefault = theme
    ? "hover:bg-gray-700 text-gray-200"
    : "hover:bg-neutral-100 text-neutral-800";

  return (
    <div className="relative w-full">
      {/* Label */}
      <label className={`block text-sm font-medium mb-1.5 ${theme ? "text-gray-300" : "text-neutral-700"}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Input Box (તમારા ગ્લોબલ ઇનપુટ જેવો જ લુક) */}
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen((open) => !open);
          }
        }}
        className={`w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm border transition outline-none cursor-pointer ${
          theme 
            ? "bg-gray-800 border-gray-700 text-white focus-within:border-blue-200" 
            : "bg-neutral-50 border-neutral-200 text-neutral-900 focus-within:border-red-500"
        }`}
      >
        <span className={`shrink-0 ${theme ? "text-gray-400" : "text-neutral-400"}`}>
          <HiCalendar className="text-lg" />
        </span>
        
        <input
          type="text"
          readOnly
          placeholder="Select Date (DD/MM/YYYY)"
          value={getDisplayDate()}
          className={`w-full bg-transparent outline-none cursor-pointer ${
            theme ? "placeholder:text-gray-500 text-white" : "placeholder:text-neutral-400 text-neutral-900"
          }`}
        />
      </div>

      <Popover
        open={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={triggerRef}
        placement="bottom-start"
        role="dialog"
        ariaLabel={`Choose ${label}`}
        className="w-[min(24rem,calc(100vw-2rem))] p-4"
      >

          {/* ===== DAYS VIEW ===== */}
          {view === "days" && (
            <>
              {/* Calendar Header — મહિનો અને વર્ષ હવે ક્લિક કરી શકાય તેવા છે */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleMonthLabelClick}
                    className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                      theme ? "hover:bg-gray-700" : "hover:bg-neutral-100"
                    }`}
                  >
                    {months[month]}
                  </button>
                  <button
                    type="button"
                    onClick={handleYearLabelClick}
                    className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                      theme ? "hover:bg-gray-700" : "hover:bg-neutral-100"
                    }`}
                  >
                    {year}
                  </button>
                </h4>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className={`p-1 rounded-lg border transition cursor-pointer ${
                      theme ? "border-gray-600 bg-gray-700 hover:bg-gray-600" : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
                    }`}
                  >
                    <HiChevronLeft className="text-base" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className={`p-1 rounded-lg border transition cursor-pointer ${
                      theme ? "border-gray-600 bg-gray-700 hover:bg-gray-600" : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
                    }`}
                  >
                    <HiChevronRight className="text-base" />
                  </button>
                </div>
              </div>

              {/* Week Labels */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {daysOfWeek.map((d) => (
                  <div key={d} className={`text-xs font-medium py-1 ${theme ? "text-gray-500" : "text-neutral-400"}`}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {blanks.map((_, idx) => (
                  <div key={`blank-${idx}`} className="py-1.5"></div>
                ))}

                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={(e) => handleDateClick(day, e)}
                    className={`py-1.5 ${cellBase} ${
                      isSelected(day) ? cellSelected : isToday(day) ? cellCurrent : cellDefault
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ===== MONTHS VIEW ===== */}
          {view === "months" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handleYearLabelClick}
                  className={`text-sm font-semibold px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                    theme ? "hover:bg-gray-700" : "hover:bg-neutral-100"
                  }`}
                >
                  {year}
                </button>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentDate(new Date(year - 1, month, 1));
                    }}
                    className={`p-1 rounded-lg border transition cursor-pointer ${
                      theme ? "border-gray-600 bg-gray-700 hover:bg-gray-600" : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
                    }`}
                  >
                    <HiChevronLeft className="text-base" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentDate(new Date(year + 1, month, 1));
                    }}
                    className={`p-1 rounded-lg border transition cursor-pointer ${
                      theme ? "border-gray-600 bg-gray-700 hover:bg-gray-600" : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
                    }`}
                  >
                    <HiChevronRight className="text-base" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {monthsShort.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onClick={(e) => handleMonthSelect(idx, e)}
                    className={`py-2.5 ${cellBase} ${
                      isSelectedMonth(idx)
                        ? cellSelected
                        : isCurrentMonth(idx)
                        ? cellCurrent
                        : cellDefault
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ===== YEARS VIEW ===== */}
          {view === "years" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold">
                  {yearRangeStart} - {yearRangeStart + 11}
                </h4>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={handlePrevYearRange}
                    className={`p-1 rounded-lg border transition cursor-pointer ${
                      theme ? "border-gray-600 bg-gray-700 hover:bg-gray-600" : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
                    }`}
                  >
                    <HiChevronLeft className="text-base" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextYearRange}
                    className={`p-1 rounded-lg border transition cursor-pointer ${
                      theme ? "border-gray-600 bg-gray-700 hover:bg-gray-600" : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
                    }`}
                  >
                    <HiChevronRight className="text-base" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {yearGrid.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={(e) => handleYearSelect(y, e)}
                    className={`py-2.5 ${cellBase} ${
                      isSelectedYear(y) ? cellSelected : isCurrentYear(y) ? cellCurrent : cellDefault
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </>
          )}
      </Popover>
    </div>
  );
}