import { IoCheckmark } from "react-icons/io5";

export function CheckBox({ checked, dark, accent }: { checked: boolean; dark: boolean; accent: string }) {
    return (
        <span
            aria-hidden="true"
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-white ${
                checked ? "" : dark ? "border-slate-600" : "border-slate-300"
            }`}
            style={checked ? { background: accent, borderColor: accent } : undefined}
        >
            {checked && <IoCheckmark className="text-sm" />}
        </span>
    );
}
