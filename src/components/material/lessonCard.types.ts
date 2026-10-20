export interface LessonCardData {
    id: string;
    title: string;
    type: string;
    mediaUrl: string;
    thumbnail: string;
    startDate: string;
    endDate: string;
    points: number | null;
    description: string;
}