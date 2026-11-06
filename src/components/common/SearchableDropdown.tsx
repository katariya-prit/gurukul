import { useState, useRef, useEffect } from "react";
import { useTheme } from "../theme/ThemeContext";
import Input from "./Input";
import { Popover } from "../overlay/OverlayPrimitives";

export interface DropdownOption {
    value: string | number;
    label: string;
}

interface SearchableDropdownProps {
    label?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    options: DropdownOption[];
    selectedValue: string | number; // selectedId ની જગ્યાએ
    onSelect: (value: string | number) => void;
    required?: boolean;
    disabled?: boolean;
}

export default function SearchableDropdown({
    label,
    placeholder,
    searchPlaceholder = "Search...",
    options,
    selectedValue,
    onSelect,
    required = false,
    disabled = false,
}: SearchableDropdownProps) {
    const { theme } = useTheme();

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const triggerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(
    (opt) => opt && String(opt.value).trim() === String(selectedValue).trim()
);

    // 🎯 સર્ચ માટેનું લોજીક (હવે label નો ઉપયોગ કરશે)
    const filteredOptions = options.filter((option) => {
        const optionLabel = option?.label || "";
        const query = searchQuery || "";
        return optionLabel.toLowerCase().includes(query.toLowerCase());
    });

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHighlightedIndex(0);
    }, [searchQuery, isOpen]);

    useEffect(() => {
        if (isOpen && listRef.current && listRef.current.children[highlightedIndex]) {
            const activeItem = listRef.current.children[highlightedIndex] as HTMLElement;
            activeItem.scrollIntoView({ block: "nearest" });
        }
    }, [highlightedIndex, isOpen]);

    const handleSelect = (val: string | number) => {
        onSelect(val);
        setSearchQuery("");
        setIsOpen(false);
    };

    return (
        <div className="relative w-full">
            <label className={`block text-sm font-medium mb-1.5 ${theme ? "text-gray-300" : "text-neutral-700"} ${disabled ? "opacity-60" : ""}`}>
                {label} {required && !disabled && <span className="text-red-500">*</span>}
            </label>

            <div
                ref={triggerRef}
                tabIndex={disabled ? -1 : 0}
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={label || placeholder || "Select an option"}
                onClick={() => {
                    if (!disabled) setIsOpen(!isOpen);
                }}
                onKeyDown={(e) => {
                    if (!isOpen && !disabled && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
                        e.preventDefault();
                        setIsOpen(true);
                    }
                }}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm min-h-10.5 flex items-center justify-between outline-none transition-all duration-200 ${disabled
                    ? theme
                        ? "bg-gray-800/50 border-gray-700/50 text-gray-500 cursor-not-allowed"
                        : "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                    : `cursor-pointer ${theme
                        ? `bg-gray-800 text-white ${isOpen ? "border-blue-500 ring-2 ring-blue-500/30" : "border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"}`
                        : `bg-neutral-50 text-neutral-900 ${isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-neutral-200 hover:border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"}`
                    }`
                    }`}
            >
                <span className={selectedOption ? "" : disabled ? "" : "text-gray-400"}>
                    {selectedOption?.label || placeholder}
                </span>

                {!disabled && (
                    <span className={`text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${theme ? "text-gray-400" : "text-neutral-400"}`}>
                        ▼
                    </span>
                )}
            </div>

            <Popover
                open={isOpen && !disabled}
                onClose={() => setIsOpen(false)}
                anchorRef={triggerRef}
                placement="bottom-start"
                role="listbox"
                ariaLabel={label || "Options"}
                matchAnchorWidth
                className="overflow-hidden rounded-xl p-0"
            >
                <div
                    className="flex max-h-60 flex-col overflow-hidden"
                    onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
                        } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setHighlightedIndex((prev) => Math.max(prev - 1, 0));
                        } else if (e.key === "Enter") {
                            e.preventDefault();
                            if (filteredOptions[highlightedIndex]) {
                                handleSelect(filteredOptions[highlightedIndex].value);
                            }
                        } else if (e.key === "Escape") {
                            setIsOpen(false);
                        }
                    }}
                >
                    <div className="p-2 border-b border-inherit">
                        <Input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="overflow-y-auto p-2 space-y-0.5" ref={listRef}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => {
                                const isSelected = String(selectedValue) === String(option.value);
                                const isHighlighted = highlightedIndex === index;

                                // 👑 જો value ન હોય અથવા ક્યાંક ડુપ્લિકેટ થતી હોય તો પણ index ના લીધે key હંમેશા ૧૦૦% યુનિક રહેશે
                                const uniqueKey = option.value !== undefined && option.value !== null
                                    ? `${option.value}-${index}`
                                    : `opt-${index}`;

                                return (
                                    <div
                                        key={uniqueKey} // સાચી અને સેફ કી
                                        role="option"
                                        aria-selected={isSelected}
                                        tabIndex={-1}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelect(option.value);
                                        }}
                                        className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors duration-150 ${isSelected
                                            ? theme ? "bg-blue-900/40 text-blue-300 font-medium" : "bg-blue-50 text-blue-600 font-medium"
                                            : isHighlighted
                                                ? theme ? "bg-gray-700 text-white" : "bg-neutral-100 text-neutral-900"
                                                : theme ? "hover:bg-gray-700 text-gray-300" : "hover:bg-neutral-100 text-neutral-700"
                                            }`}
                                    >
                                        {option.label}
                                    </div>
                                );
                            })
                        ) : (
                            <div className={`px-3 py-2 text-sm text-center ${theme ? "text-gray-500" : "text-neutral-400"}`}>
                                No data found
                            </div>
                        )}
                    </div>
                </div>
            </Popover>
        </div>
    );
}