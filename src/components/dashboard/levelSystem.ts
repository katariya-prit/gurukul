export interface LevelTask {
    id: string;
    title: string;
    reward: number;
    progress: number;
    target: number;
}

export interface LevelState {
    level: number;
    name: string;
    xp: number;
    xpStart: number;
    xpNext: number;
    tasks: LevelTask[];
}

export const LEVEL_NAMES = ["Beginner", "Learner", "Achiever", "Scholar", "Master"] as const;

export const MAX_LEVEL = LEVEL_NAMES.length;

export const STATIC_LEVEL: LevelState = {
    level: 3,
    name: LEVEL_NAMES[2],
    xp: 640,
    xpStart: 500,
    xpNext: 1000,
    tasks: [
        { id: "weekly-lessons", title: "Complete 3 lessons this week", reward: 50, progress: 2, target: 3 },
        { id: "audio-upload", title: "Upload an audio recitation", reward: 40, progress: 1, target: 1 },
        { id: "high-score", title: "Score 80% or more in a lesson", reward: 60, progress: 0, target: 1 },
    ],
};