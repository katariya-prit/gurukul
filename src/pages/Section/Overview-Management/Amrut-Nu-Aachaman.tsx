import React, { useState, useEffect, useRef } from 'react';
import { Upload, Save, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'; 
import DatePicker from '../../../components/common/Calendar';
import ImageCropEditor from '../../../components/common/ImageCropEditor';
import { useTheme } from '../../../components/theme/ThemeContext';

interface AmrutData {
    id: string;
    image: string;
    description: string;
    date: string;
    timestamp: number;
}

const AmrutNuAachaman: React.FC = () => {
    const { theme } = useTheme(); 

    const [dataList, setDataList] = useState<AmrutData[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [cropFile, setCropFile] = useState<File | null>(null);
    const [isCropEditorOpen, setIsCropEditorOpen] = useState(false);

    const [headerDate, setHeaderDate] = useState(new Date().toISOString().split('T')[0]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<AmrutData | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    
    // ડિસ્ક્રિપ્શન સ્ટેટ્સ
    const [isDescExpanded, setIsDescExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const savedData = localStorage.getItem('amrutData');
        if (savedData) {
            const parsedData: AmrutData[] = JSON.parse(savedData);
            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
            const currentTime = new Date().getTime();
            const filteredData = parsedData.filter(item => currentTime - item.timestamp <= thirtyDaysInMs);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDataList(filteredData);
        }
    }, []);

    // પ્રથમ લાઇન માટે ડેટા સ્પ્લિટ કરવો
    const lines = selectedItem?.description ? selectedItem.description.trim().split('\n') : [];
    const firstLine = lines[0] || "";
    const hasMultipleLines = lines.length > 1;

    useEffect(() => {
        const checkOverflow = () => {
            if (textRef.current && !isDescExpanded) {
                setIsOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth);
            }
        };
        
        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [selectedItem, isDescExpanded, isModalOpen]);

    const handleCroppedFile = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => setSelectedImage(reader.result as string);
        reader.readAsDataURL(file);
        setCropFile(null);
        setIsCropEditorOpen(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCropFile(file);
            setIsCropEditorOpen(true);
        }
        e.target.value = '';
    };

    const handleSave = () => {
        if (!selectedImage) {
            alert('Please select an image first!');
            return;
        }

        if (!description.trim()) {
            alert('Please enter a description before saving!');
            return;
        }

        // Check if 3 images are already added for the selected date
        const imagesCountForSelectedDate = dataList.filter(item => item.date === headerDate).length;
        if (imagesCountForSelectedDate >= 3) {
            alert('You can only add up to 3 images per day!');
            
            // UPDATED LOGIC: Reset image, description, and file input on error
            setSelectedImage(null);
            setDescription('');
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        const newData: AmrutData = {
            id: Date.now().toString(),
            image: selectedImage,
            description: description.trim(),
            date: headerDate,
            timestamp: new Date().getTime(),
        };

        const updatedList = [newData, ...dataList];
        setDataList(updatedList);

        try {
            localStorage.setItem('amrutData', JSON.stringify(updatedList));
        } catch (error) {
            console.error("Storage full error caught:", error);
        }

        setSelectedImage(null);
        setDescription('');

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
        }, 3000);
    };

    const openModal = (item: AmrutData) => {
        setSelectedItem(item);
        setIsDescExpanded(false); 
        setIsOverflowing(false);
        setIsModalOpen(true);
    };

    const currentIndex = selectedItem ? dataList.findIndex(item => item.id === selectedItem.id) : -1;

    const handleNext = React.useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (currentIndex !== -1 && currentIndex < dataList.length - 1) {
            setSelectedItem(dataList[currentIndex + 1]);
            setIsDescExpanded(false);
            setIsOverflowing(false);
        }
    }, [currentIndex, dataList]);

    const handlePrev = React.useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (currentIndex > 0) {
            setSelectedItem(dataList[currentIndex - 1]);
            setIsDescExpanded(false);
            setIsOverflowing(false);
        }
    }, [currentIndex, dataList]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isModalOpen) return;
            if (e.key === 'ArrowRight') handleNext();
            else if (e.key === 'ArrowLeft') handlePrev();
            else if (e.key === 'Escape') setIsModalOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, handleNext, handlePrev]);

    return (
        <div className={`flex flex-col gap-4 p-4 min-h-screen transition-colors duration-300 relative ${theme ? "bg-[#0B1120] text-slate-200" : "bg-white text-slate-900"}`}>

            {/* --- SUCCESS POPUP --- */}
            {showSuccess && (
                <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-green-500 text-white px-5 py-3 rounded-lg shadow-lg">
                    <CheckCircle size={20} />
                    <span className="font-semibold text-sm">Saved Successfully!</span>
                </div>
            )}

            {/* --- HEADER --- */}
            <div className={`flex justify-between items-center p-3 rounded-xl shadow-sm border ${theme ? "bg-[#151D2F] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex flex-col gap-0.5">
                    <h1 className={`text-3xl font-bold ${theme ? "text-white" : "text-gray-800"}`}>
                        Amrut Nu Aachaman
                    </h1>
                    <p className={`text-sm font-medium ${theme ? "text-slate-400" : "text-slate-500"}`}>
                        Daily spiritual reflections and media management
                    </p>
                </div>

                <div className="w-50">
                    <DatePicker
                        label=""
                        selectedValue={headerDate}
                        onChange={(dateStr) => setHeaderDate(dateStr)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {/* --- LEFT SIDE: ADD RECORD --- */}
                <div className={`rounded-xl p-4 border ${theme ? "bg-[#151D2F] border-slate-800 shadow-none" : "bg-slate-50 border-slate-200 shadow-sm"}`}>
                    <h2 className={`text-md font-semibold mb-3 border-b pb-2 ${theme ? "text-white border-slate-800" : "text-slate-900 border-slate-200"}`}>
                        Add New Image
                    </h2>
                    
                    <div className="flex flex-wrap items-start gap-3">
                        <label className={`shrink-0 w-20 h-16 border-2 border-dashed rounded-lg cursor-pointer flex flex-col items-center justify-center overflow-hidden ${theme ? "border-slate-700 hover:border-indigo-500 bg-[#0B1120]" : "border-slate-300 hover:border-red-500 bg-white"}`}>
                            {selectedImage ? (
                                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Upload size={19} className={theme ? "text-slate-400" : "text-slate-500"} />
                            )}
                            <input
                                ref={fileInputRef}
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </label>

                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description"
                            required
                            className={`w-full max-w-142 h-16 rounded-lg p-2 text-md outline-none focus:ring-1 resize-none ${theme
                                    ? "bg-[#0B1120] border border-slate-700 focus:ring-indigo-500 text-slate-200 placeholder:text-slate-500"
                                    : "bg-white border border-slate-300 focus:ring-red-500 text-slate-900 placeholder:text-slate-400"
                                }`}
                        />

                        <button
                            onClick={handleSave}
                            className={`shrink-0 h-16 w-30 text-white rounded-lg flex flex-row items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${theme ? "bg-blue-600 hover:bg-blue-700 shadow-none" : "bg-red-600 hover:bg-red-700 shadow-sm"}`}>
                            <Save size={20} />
                            <span className="text-md font-bold">Save</span>
                        </button>
                    </div>
                </div>

                {/* --- RIGHT SIDE: LIST --- */}
                <div className={`rounded-xl p-4 border min-h-37 ${theme ? "bg-[#151D2F] border-slate-800 shadow-none" : "bg-slate-50 border-slate-200 shadow-sm"}`}>
                    <div className={`flex justify-between items-center mb-3 border-b pb-2 ${theme ? "border-slate-800" : "border-slate-200"}`}>
                        <h2 className={`text-md font-semibold ${theme ? "text-white" : "text-slate-900"}`}>Image Preview</h2>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${theme ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-700"}`}>
                            Last 30 Days
                        </span>
                    </div>

                    <div className="space-y-2">
                        {dataList.length > 0 ? (
                            dataList.map((item) => (
                                <div key={item.id} className={`flex items-center gap-3 p-2 rounded-lg border group ${theme ? "bg-[#0B1120] border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 shadow-sm hover:shadow-md"}`}>
                                    <img
                                        src={item.image}
                                        alt="thumb"
                                        className={`w-12 h-12 object-cover rounded cursor-pointer ring-offset-2 transition-all ${theme ? "hover:ring-2 ring-indigo-500" : "hover:ring-2 ring-red-500"}`}
                                        onClick={() => openModal(item)}
                                    />
                                    <p className={`grow text-sm line-clamp-2 italic font-normal ${theme ? "text-slate-300" : "text-slate-800"}`}>
                                        {item.description ? `"${item.description}"` : <span className="opacity-60">No description provided</span>}
                                    </p>
                                    <span className={`text-[12px] font-semibold px-2 py-1 rounded ${theme ? "text-indigo-500 bg-indigo-500/10" : "text-red-600 bg-red-50 border border-red-100"}`}>
                                        {item.date}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className={`text-center text-xs py-6 ${theme ? "text-slate-400" : "text-slate-500"}`}>No Image available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- IMAGE POPUP MODAL (70% Image & 30% Description) --- */}
            <ImageCropEditor
                file={cropFile}
                isOpen={isCropEditorOpen}
                theme={theme}
                shape="square"
                title="Edit Amrut Image"
                subtitle="Crop and zoom the selected memory to fit the gallery"
                onClose={() => {
                    setCropFile(null);
                    setIsCropEditorOpen(false);
                }}
                onCropped={handleCroppedFile}
            />

            {isModalOpen && selectedItem && (
                <div 
                    onClick={() => setIsModalOpen(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-sm cursor-pointer"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-full rounded-2xl overflow-hidden border cursor-default shadow-2xl ${
                            theme ? "bg-[#151D2F] border-white/10" : "bg-white border-slate-200"
                        }`}
                    >
                        <div className="flex flex-col md:flex-row h-auto md:h-[80vh] max-h-212.5">
                            
                            {/* --- LEFT SIDE: IMAGE AREA (70% Width) --- */}
                            <div className={`w-full md:w-[70%] flex items-center justify-center p-6 relative overflow-hidden border-b md:border-b-0 ${
                                theme ? "bg-[#090F1C]" : "bg-slate-100"
                            }`}>
                                {/* Blur Background */}
                                <img
                                    key={`blur-${selectedItem.id}`}
                                    src={selectedItem.image}
                                    alt="Blur bg"
                                    className="absolute inset-0 w-full h-full object-cover blur-2xl scale-115 opacity-40 pointer-events-none select-none"
                                />

                                {/* Center Image Wrapper */}
                                <div className="relative z-10 w-full h-full flex items-center justify-center">
                                    <img
                                        key={selectedItem.id} 
                                        src={selectedItem.image}
                                        alt="Full view"
                                        className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                                    />
                                </div>

                                {/* Left Navigation */}
                                {currentIndex > 0 && (
                                    <button
                                        onClick={handlePrev}
                                        className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full shadow-lg border z-20 transition-transform hover:scale-105 active:scale-95 ${
                                            theme ? "bg-black/40 text-white hover:bg-black/60 border-white/10" : "bg-white/80 text-slate-800 hover:bg-white border-slate-200"
                                        }`}
                                    >
                                        <ChevronLeft size={24} strokeWidth={2.5} />
                                    </button>
                                )}

                                {/* Right Navigation */}
                                {currentIndex < dataList.length - 1 && (
                                    <button
                                        onClick={handleNext}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full shadow-lg border z-20 transition-transform hover:scale-105 active:scale-95 ${
                                            theme ? "bg-black/40 text-white hover:bg-black/60 border-white/10" : "bg-white/80 text-slate-800 hover:bg-white border-slate-200"
                                        }`}
                                    >
                                        <ChevronRight size={24} strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>

                            {/* --- RIGHT SIDE: CONTENT AREA (30% Width) --- */}
                            <div className={`w-full md:w-[30%] p-6 flex flex-col md:border-l ${
                                theme ? "bg-[#151D2F] border-white/10" : "bg-white border-slate-200"
                            }`}>
                                <div className="grow flex flex-col gap-5 overflow-hidden">
                                    <div className="flex items-center justify-between shrink-0">
                                        <h3 className={`text-xl font-extrabold tracking-tight ${
                                            theme ? "text-indigo-400" : "text-red-600"
                                        }`}>
                                            Gurukul
                                        </h3>
                                        <span className={`text-[11px] px-3 py-1 rounded-full font-mono font-bold border ${
                                            theme ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" : "bg-slate-100 text-slate-700 border-slate-200"
                                        }`}>
                                            {selectedItem.date}
                                        </span>
                                    </div>
                                    
                                    {/* DESCRIPTION BOX */}
                                    <div className="overflow-y-auto pr-1 grow block">
                                        {isDescExpanded ? (
                                            <p className={`font-serif italic text-[17px] leading-relaxed whitespace-pre-line wrap-break-word block ${
                                                theme ? "text-slate-300/90" : "text-slate-700"
                                            }`}>
                                                {selectedItem.description ? `"${selectedItem.description}"` : "No description provided"}
                                            </p>
                                        ) : (
                                            <div className="block max-w-full text-[17px] font-serif italic leading-7">
                                                <span 
                                                    ref={textRef}
                                                    className={`whitespace-nowrap overflow-hidden text-clip inline-block max-w-[calc(100%-25px)] align-bottom ${
                                                        theme ? "text-slate-300/90" : "text-slate-700"
                                                    }`}
                                                >
                                                    {selectedItem.description ? `"${firstLine}` : "No description provided"}
                                                </span>
                                                
                                                {(isOverflowing || hasMultipleLines) && (
                                                    <span 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsDescExpanded(true);
                                                        }}
                                                        className={`inline-block cursor-pointer text-sm font-black tracking-widest px-1 align-baseline transition-colors ${
                                                            theme ? "text-indigo-400 hover:text-indigo-300" : "text-red-600 hover:text-red-500"
                                                        }`}
                                                        title="Click here to read more"
                                                    >
                                                        ...
                                                    </span>
                                                )}

                                                {!(isOverflowing || hasMultipleLines) && selectedItem.description && (
                                                    <span className={theme ? "text-slate-300/90" : "text-slate-700"}>"</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t flex justify-between items-center shrink-0 border-slate-200 dark:border-white/10">
                                    <p className={`text-[11px] font-semibold tracking-wider uppercase ${
                                        theme ? "text-slate-500" : "text-slate-400"
                                    }`}>
                                        Image {currentIndex + 1} of {dataList.length}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AmrutNuAachaman;