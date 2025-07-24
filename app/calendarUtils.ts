import { Dimensions} from 'react-native';
export type Slot = {
  name: string;
  type: 'meeting' | 'assignment' | 'chore';
  start: string;
  end: string;
  meeting_id?: number;
  assignment_id?: number;
  chore_id?: number;
  occurence_id?: number | string;
  id?: string | number;
  completed?: boolean;
  // For future extensibility
  [key: string]: any;
};

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

export const groupSlotsByDay = (slots: Slot[]) => {
  // Group slots by the *local* date of their start time, not by the UTC date string
  const grouped: Record<string, Slot[]> = {};
  for (const slot of slots) {
    // Convert slot.start to local Date, then get local date string (YYYY-MM-DD)
    const localDate = new Date(slot.start);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const dayKey = `${year}-${month}-${day}`;
    if (!grouped[dayKey]) grouped[dayKey] = [];
    grouped[dayKey].push(slot);
  }
  return grouped;
};

export const getWeekDaysFromDate = (referenceDate: Date) => {
  // Get the week days using local time, not UTC
  const date = new Date(referenceDate);
  // Set to Sunday of the week (local time)
  date.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(date);
    day.setDate(date.getDate() + i);
    // Get local date string (YYYY-MM-DD)
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const dayNum = String(day.getDate()).padStart(2, '0');
    return {
      date: day,
      label: day.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      iso: `${year}-${month}-${dayNum}`,
    };
  });
};

export const getStartOfWeek = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = d.getDate() - day; // Subtract the day index to get back to Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0); // Reset time to midnight
    return d;
};

export const screenWidth = Dimensions.get('window').width;