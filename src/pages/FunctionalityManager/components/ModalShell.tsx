import type { ReactNode } from "react";
import Modal from "./Modal";

interface ModalShellProps {
    title: string;
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    wide?: boolean;
}

export default function ModalShell({ title, open, onClose, children, wide = false }: ModalShellProps) {
    return (
        <Modal title={title} open={open} onClose={onClose} wide={wide} size={wide ? "lg" : "md"}>
            {children}
        </Modal>
    );
}
