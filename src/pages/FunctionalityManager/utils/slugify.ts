export function slugify(value: string): string {
    return value
        .normalize("NFKD")
        .toLowerCase()
        .trim()
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}
