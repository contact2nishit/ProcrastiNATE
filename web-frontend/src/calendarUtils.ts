

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

/**
 * Formats a given ISO date string into a human-readable time string.
 * The time is formatted based on the local timezone.
 *
 * @param iso - The ISO date string to format.
 * @returns A string representing the time in 'hh:mm AM/PM' format.
 */
export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Groups an array of slots by their local start date.
 *
 * @param slots - An array of Slot objects to group.
 * @returns An object where keys are local date strings (YYYY-MM-DD) and values are arrays of slots.
 */
export const groupSlotsByDay = (slots: Slot[]) => {
  /**
   * Groups an array of slots by their local start date.
   *
   * @param slots - An array of Slot objects to group.
   * @returns An object where keys are local date strings (YYYY-MM-DD) and values are arrays of slots.
   */
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

/**
 * Generates an array of week days starting from the Sunday of the given reference date.
 *
 * @param referenceDate - The date to calculate the week days from.
 * @returns An array of objects containing the date, label, and ISO string for each day of the week.
 */
export const getWeekDaysFromDate = (referenceDate: Date) => {
  /**
   * Generates an array of week days starting from the Sunday of the given reference date.
   *
   * @param referenceDate - The date to calculate the week days from.
   * @returns An array of objects containing the date, label, and ISO string for each day of the week.
   */
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

/**
 * Calculates the start of the week (Sunday midnight) for a given date.
 *
 * @param date - The date to calculate the start of the week for. Defaults to the current date.
 * @returns A Date object representing Sunday midnight of the week.
 */
export const getStartOfWeek = (date = new Date()) => {
  /**
   * Calculates the start of the week (Sunday midnight) for a given date.
   *
   * @param date - The date to calculate the start of the week for. Defaults to the current date.
   * @returns A Date object representing Sunday midnight of the week.
   */
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = d.getDate() - day; // Subtract the day index to get back to Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0); // Reset time to midnight
  return d;
};

/**
 * Gets the screen width of the device.
 *
 * @returns The width of the device screen in pixels.
 */
// export const screenWidth = Dimensions.get('window').width;