import { Dimensions} from 'react-native';
export type Slot = {
  name: string;
  type: string;
  start: string;
  end: string;
  meeting_id?: number;
  occurence_id?: number;
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

export const screenWidth = Dimensions.get('window').width;