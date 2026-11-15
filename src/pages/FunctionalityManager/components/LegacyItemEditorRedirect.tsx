import { Navigate, useParams } from "react-router-dom";

interface LegacyItemEditorRedirectProps {
    section: "rubrics" | "levels" | "permissions";
}

export default function LegacyItemEditorRedirect({ section }: LegacyItemEditorRedirectProps) {
    const { itemId } = useParams<{ itemId: string }>();
    return <Navigate to={`/dashboard/functionality-manager/${section}/${itemId ?? ""}`} replace />;
}
