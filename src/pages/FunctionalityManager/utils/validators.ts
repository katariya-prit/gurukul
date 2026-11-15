import type { ItemLevel, RubricCriterion } from "../types";

export function validateRubric(criteria: RubricCriterion[]): string | null {
    if (criteria.length === 0) return "Add at least one criterion.";
    if (criteria.some((criterion) => !criterion.label.trim() || !criterion.key.trim())) {
        return "Every criterion needs a label and key.";
    }
    if (criteria.some((criterion) => !Number.isFinite(criterion.weight) || criterion.weight < 0)) {
        return "Criterion weights must be zero or greater.";
    }
    if (criteria.some((criterion) => !Number.isFinite(criterion.maxPoints) || criterion.maxPoints <= 0)) {
        return "Each criterion must have a maximum score greater than zero.";
    }
    return criteria.reduce((sum, criterion) => sum + criterion.weight, 0) === 100
        ? null
        : "Criterion weights must total exactly 100.";
}

export function validateLevels(levels: ItemLevel[]): string | null {
    if (levels.length === 0) return "Add at least one level.";
    if (levels.some((level) => !level.name.trim())) return "Every level needs a name.";
    if (levels[0].minPoints !== 0) return "The first level must start at 0 points.";
    for (let index = 1; index < levels.length; index += 1) {
        if (levels[index].minPoints <= levels[index - 1].minPoints) {
            return "Each level must require more points than the previous level.";
        }
    }
    return null;
}

export function validateJsonConfig(value: string): string | null {
    try {
        const parsed: unknown = JSON.parse(value);
        return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
            ? null
            : "Configuration must be a JSON object.";
    } catch {
        return "Enter valid JSON.";
    }
}
