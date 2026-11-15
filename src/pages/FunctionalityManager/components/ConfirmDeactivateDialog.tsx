import { useTheme } from "../../../components/theme/ThemeContext";
import Modal from "./Modal";

interface ConfirmDeactivateDialogProps {
    name: string;
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function ConfirmDeactivateDialog({ name, open, onCancel, onConfirm }: ConfirmDeactivateDialogProps) {
    const { theme } = useTheme();

    return (
        <Modal
            title={`Deactivate ${name}?`}
            open={open}
            onClose={onCancel}
            size="sm"
            role="alertdialog"
        >
            <div className="space-y-6">
                <p className={`text-sm ${theme ? "text-slate-300" : "text-slate-600"}`}>
                    Data is kept, only hidden from menus.
                </p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        autoFocus
                        type="button"
                        onClick={onCancel}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-inherit px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
                    >
                        Deactivate
                    </button>
                </div>
            </div>
        </Modal>
    );
}
