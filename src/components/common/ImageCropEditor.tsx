import { useEffect, useState, useRef } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../overlay/OverlayPrimitives";

interface ImageCropEditorProps {
  file: File | null;
  isOpen: boolean;
  theme: boolean;
  shape?: "circle" | "square";
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onCropped: (file: File) => void;
}

// સુધારેલું ફંક્શન: જે સ્કેલિંગ કેલ્ક્યુલેટ કરીને પરફેક્ટ ક્રોપ કરશે
const createCroppedFile = async (
  image: HTMLImageElement,
  cropArea: PixelCrop,
  fileName: string
): Promise<File> => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Could not prepare the image for upload.");

  // ઓરિજિનલ ઈમેજ અને સ્ક્રીન પર દેખાતી ઈમેજ વચ્ચેનો રેશિયો (Scale Factor)
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // કેનવાસની સાઈઝને સ્કેલ મુજબ સેટ કરવી
  canvas.width = Math.floor(cropArea.width * scaleX);
  canvas.height = Math.floor(cropArea.height * scaleY);

  context.imageSmoothingQuality = "high";

  // ઈમેજ ડ્રો કરતી વખતે સ્કેલ મુજબ ડાયમેન્શન્સ સેટ કરવા
  context.drawImage(
    image,
    cropArea.x * scaleX,
    cropArea.y * scaleY,
    cropArea.width * scaleX,
    cropArea.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not prepare the image for upload."));
        return;
      }
      resolve(new File([blob], fileName || "cropped-image.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.95);
  });
};

export default function ImageCropEditor({
  file,
  isOpen,
  theme,
  shape = "circle",
  title = "Edit Photo",
  subtitle = "Zoom and drag the box corners to resize your image perfectly",
  onClose,
  onCropped,
}: ImageCropEditorProps) {
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isOpen || !file) return;

    const objectUrl = URL.createObjectURL(file);
    setEditingImage(objectUrl);
    setCrop(undefined);
    setCompletedCrop(null);
    setZoom(1);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, isOpen]);

  // ઈમેજ લોડ થાય ત્યારે ડિફોલ્ટ સિલેક્શન સેટ કરવા
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;

    if (shape === "circle") {
      // સર્કલ માટે ઈમેજની મધ્યમાં કમ્પ્લીટ ગોળ સેટ કરશે
      const minDimension = Math.min(width, height);
      const initialCrop = centerCrop(
        makeAspectCrop(
          {
            unit: "px",
            width: minDimension,
          },
          1,
          width,
          height
        ),
        width,
        height
      );
      setCrop(initialCrop);
    } else {
      // Square અથવા ઇવેન્ટ કવર માટે ડિફોલ્ટ 100% ફૂલ વિડ્થ અને હાઈટ સિલેક્ટ કરશે
      setCrop({ unit: "%", x: 0, y: 0, width: 100, height: 100 });
    }
  };

  const closeEditor = () => {
    setEditingImage(null);
    setCompletedCrop(null);
    onClose();
  };

  const confirmCrop = async () => {
    // imgRef.current નો સીધો ઉપયોગ જેથી નવેસરથી ઈમેજ લોડ ન કરવી પડે
    if (!imgRef.current || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) return;

    try {
      const croppedFile = await createCroppedFile(
        imgRef.current, 
        completedCrop, 
        file?.name || "cropped-image.jpg"
      );
      closeEditor();
      onCropped(croppedFile);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to edit image");
    }
  };

  if (!isOpen || !file || !editingImage) return null;

  return (
    <Modal open onClose={closeEditor} title={title} description={subtitle} className="max-w-2xl p-0">
      {/* CSS Injection for 3x3 Grid inside the Crop Area */}
      <style>{`
        .custom-crop-grid .ReactCrop__crop-selection::before,
        .custom-crop-grid .ReactCrop__crop-selection::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          opacity: 0.5;
        }
        .custom-crop-grid .ReactCrop__crop-selection::before {
          border-top: 1px dashed rgba(255, 255, 255, 0.8);
          border-bottom: 1px dashed rgba(255, 255, 255, 0.8);
          height: 33.333%;
          top: 33.333%;
        }
        .custom-crop-grid .ReactCrop__crop-selection::after {
          border-left: 1px dashed rgba(255, 255, 255, 0.8);
          border-right: 1px dashed rgba(255, 255, 255, 0.8);
          width: 33.333%;
          left: 33.333%;
        }
      `}</style>

      <div
        className={`pointer-events-auto flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden ${
          theme
            ? "bg-slate-900 text-slate-100"
            : "bg-white/95 text-slate-900"
        }`}
      >
        <div className={`relative flex items-center justify-center h-[min(28rem,60dvh)] min-h-64 w-full shrink-0 overflow-hidden p-4 ${theme ? "bg-slate-950/50" : "bg-slate-50"}`}>
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.1s ease-out"
            }}
          >
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={shape === "circle" ? 1 : undefined}
              circularCrop={shape === "circle"}
              className="custom-crop-grid max-h-full"
            >
              <img
                ref={imgRef}
                src={editingImage}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-h-[min(25rem,55dvh)] w-auto object-contain"
              />
            </ReactCrop>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5 border-t border-slate-700/20">
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={closeEditor} className={`rounded-xl px-5 py-2 text-sm font-medium transition-all ${theme ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"}`}>
              Cancel
            </button>
            <button type="button" onClick={confirmCrop} className={`flex items-center gap-2 rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all active:scale-95 ${theme ? "bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/25" : "bg-red-500 hover:bg-red-600 hover:shadow-red-500/25"}`}>
              <Check size={18} strokeWidth={2.5} /> Apply
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}