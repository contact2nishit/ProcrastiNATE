import React, { createContext, useState, useContext, ReactNode } from 'react';

type Meeting = {
  name: string;
  startTime: string;
  endTime: string;
  recurrence: string;
  link_or_loc: string;
};

type MeetingContextType = {
  meetings: Meeting[];
  setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>;
};

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export const MeetingProvider = ({ children }: { children: ReactNode }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  return (
    <MeetingContext.Provider value={{ meetings, setMeetings }}>
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeetingContext = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeetingContext must be used within a MeetingProvider');
  }
  return context;
};