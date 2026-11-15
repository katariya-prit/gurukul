import { useState } from "react";
import SearchableDropdown from "../../../components/common/SearchableDropdown";
import Button from "../../../components/common/Button";
import type { FunctionalityItem } from "../types";
import Modal from "./Modal";

interface CopyFromItemDialogProps {
    open: boolean;
    items: FunctionalityItem[];
    currentItemId: number;
    title: string;
    onClose: () => void;
    onCopy: (item: FunctionalityItem) => void;
}

export default function CopyFromItemDialog({
    open,
    items,
    currentItemId,
    title,
    onClose,
    onCopy,
}: CopyFromItemDialogProps) {
    const [sourceId, setSourceId] = useState<number | "">("");
    const sources = items.filter((item) => item.id !== currentItemId);

    const close = () => {
        setSourceId("");
        onClose();
    };

    const copy = () => {
        const source = sources.find((item) => item.id === sourceId);
        if (!source) return;
        onCopy(source);
        close();
    };

    return (
        <Modal title={title} open={open} onClose={close} size="md">
            <div className="space-y-5">
                <SearchableDropdown
                    label="Source item"
                    placeholder="Choose an item"
                    triggerClassName="h-11 min-h-11"
                    options={sources.map((item) => ({
                        value: item.id,
                        label: `${item.functionalityName} · ${item.departmentName} · ${item.name}`,
                    }))}
                    selectedValue={sourceId}
                    onSelect={(value) => setSourceId(Number(value))}
                />
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={close}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-inherit px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5 dark:hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <Button
                        type="button"
                        onClick={copy}
                        disabled={!sourceId}
                        className="min-h-[44px]"
                    >
                        Copy to editor
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
