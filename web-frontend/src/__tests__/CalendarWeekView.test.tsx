import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarWeekView from '../components/CalendarWeekView';

const baseSlots = [
  { type: 'meeting', name: 'Sprint Planning', start: '2025-01-06T09:00:00+00:00', end: '2025-01-06T10:00:00+00:00', meeting_id: 9, occurence_id: 900 },
  { type: 'assignment', name: 'HW2', start: '2025-01-07T12:00:00+00:00', end: '2025-01-07T13:30:00+00:00', id: 'assignment_2_777' },
  { type: 'chore', name: 'Laundry', start: '2025-01-08T18:00:00+00:00', end: '2025-01-08T19:00:00+00:00', id: 'chore_3_888' },
];

describe('CalendarWeekView (presentational)', () => {
  test('renders provided slots in their week', async () => {
    render(
      <CalendarWeekView
        slots={baseSlots as any}
        initialReferenceDate={new Date('2025-01-06T00:00:00Z')}
      />
    );
    expect(await screen.findByText('Sprint Planning')).toBeInTheDocument();
    expect(screen.getByText('HW2')).toBeInTheDocument();
    expect(screen.getByText('Laundry')).toBeInTheDocument();
  });

  test('clicking a slot shows popup with actions hooked by props', async () => {
    const onUpdateMeeting = jest.fn();
    const onDeleteMeeting = jest.fn();
    const onRescheduleAssignment = jest.fn();
    const onDeleteAssignment = jest.fn();
    const onRescheduleChore = jest.fn();
    const onDeleteChore = jest.fn();

    render(
      <CalendarWeekView
        slots={baseSlots as any}
        initialReferenceDate={new Date('2025-01-06T00:00:00Z')}
        onUpdateMeeting={onUpdateMeeting}
        onDeleteMeeting={onDeleteMeeting}
        onRescheduleAssignment={onRescheduleAssignment}
        onDeleteAssignment={onDeleteAssignment}
        onRescheduleChore={onRescheduleChore}
        onDeleteChore={onDeleteChore}
      />
    );

    await userEvent.click(await screen.findByText('Sprint Planning'));
    await userEvent.click(await screen.findByRole('button', { name: /update/i }));
    expect(onUpdateMeeting).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sprint Planning' }));

    await userEvent.click(await screen.findByText('HW2'));
    await userEvent.click(await screen.findByRole('button', { name: /reschedule/i }));
    expect(onRescheduleAssignment).toHaveBeenCalledWith(expect.objectContaining({ name: 'HW2' }));

    await userEvent.click(await screen.findByText('Laundry'));
    await userEvent.click(await screen.findByRole('button', { name: /^delete$/i }));
    expect(onDeleteChore).toHaveBeenCalledWith(expect.objectContaining({ name: 'Laundry' }));
  });
});
