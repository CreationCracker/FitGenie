// src/types/fitness.ts

export interface ITask {
  _id?: string; 
  date: string;
  title: string;
  scheduledTime: string;
  done: boolean;
  missed: boolean;
  order: number;
}

export interface IGoal {
  _id?: string;
  userId: string;
  title: string;
  type: "gym" | "yoga" | "diet" | "cardio";
  physiqueTarget: string;
  durationDays: number;
  medicalConditions: string[];
  dietPreference?: string;
  notes?: string;
  startDate: string | Date;
  endDate: string | Date;
  progress: number;
  isActive: boolean;
  status: "active" | "completed" | "abandoned";
  tasks: ITask[];
}