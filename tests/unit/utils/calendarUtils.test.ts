import { Slot, formatTime, getStartOfWeek, getWeekDaysFromDate, groupSlotsByDay } from '../../../app/calendarUtils';

describe('Calendar Utils', () => {
    test('Gets correct start of week', () => {
        const sundayMidnight = new Date(2025, 6, 20, 0, 0, 0);
        const midWeek = new Date(2025, 6, 23, 14, 30, 0);
        const saturdayLateNight = new Date(2025, 6, 26, 23, 59, 59);
        expect(getStartOfWeek(sundayMidnight)).toEqual(sundayMidnight);
        expect(getStartOfWeek(midWeek)).toEqual(sundayMidnight);
        expect(getStartOfWeek(saturdayLateNight)).toEqual(sundayMidnight);
    });

    test('Formats time correctly', () => {
        const isoString = '2025-07-25T14:30:00Z';
        const expectedTime = new Date(isoString).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
        expect(formatTime(isoString)).toEqual(expectedTime);
    });

    test('Groups slots by day', () => {
        const slots: Slot[] = [
            { name: 'Meeting', type: 'meeting', start: '2025-07-25T14:30:00Z', end: '2025-07-25T15:30:00Z' },
            { name: 'Assignment', type: 'assignment', start: '2025-07-26T10:00:00Z', end: '2025-07-26T11:00:00Z' },
            { name: 'Chore', type: 'chore', start: '2025-07-25T16:00:00Z', end: '2025-07-25T17:00:00Z' },
        ];
        const grouped = groupSlotsByDay(slots);
        expect(Object.keys(grouped)).toEqual(['2025-07-25', '2025-07-26']);
        expect(grouped['2025-07-25']).toHaveLength(2);
        expect(grouped['2025-07-26']).toHaveLength(1);
    });

    test('Gets week days from date', () => {
        const referenceDate = new Date(2025, 6, 23); // Wednesday
        const weekDays = getWeekDaysFromDate(referenceDate);
        expect(weekDays).toHaveLength(7);
        expect(weekDays[0].label).toContain('Sun');
        expect(weekDays[6].label).toContain('Sat');
        expect(weekDays[0].iso).toEqual('2025-07-20');
        expect(weekDays[6].iso).toEqual('2025-07-26');
    });
});