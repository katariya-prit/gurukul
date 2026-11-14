import FilterBar from "./FilterBar";
import type { DepartmentFunctionality, Functionality, FunctionalityItem } from "../types";

interface ItemPickerFiltersProps {
    functionalities: Functionality[];
    assignments: DepartmentFunctionality[];
    items: FunctionalityItem[];
    functionalityId: number | "";
    departmentId: number | "";
    itemId: number | "";
    search: string;
    onFunctionalityChange: (id: number | "") => void;
    onDepartmentChange: (id: number | "") => void;
    onItemChange: (id: number | "") => void;
    onSearchChange: (value: string) => void;
    showItem?: boolean;
}

export default function ItemPickerFilters(props: ItemPickerFiltersProps) {
    return <FilterBar {...props} />;
}
