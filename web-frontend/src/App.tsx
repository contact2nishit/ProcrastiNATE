import React from 'react';
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login';
// import Signup from './pages/Signup';
// import { CurrentScheduleProvider } from './context/CurrentScheduleContext';
// import { PotentialScheduleProvider } from './context/PotentialScheduleContext';
// import Home from './pages/Home';
// import CalendarView from './pages/CalendarView';
// import SchedulePicker from './pages/SchedulePicker';
// import EventSelection from './pages/EventSelection';
// import CalendarViewPotential from './pages/CalendarViewPotential';
// import RescheduleScreen from './pages/RescheduleScreen';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const token = localStorage.getItem("token");
	return token ? <>{children}</> : <Navigate to="/" replace />;
};

const App: React.FC = () => {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Login />} />
				{/* <Route path="/signup" element={<Signup />} />
        		<Route path='/requiresCurrentSchedule/Home' element={
					<ProtectedRoute>
						<CurrentScheduleProvider>
							<Home />
						</CurrentScheduleProvider>
					</ProtectedRoute>
					}
				/>
        <Route path='/requiresCurrentSchedule/CalendarView' element={
          <ProtectedRoute>
            <CurrentScheduleProvider>
              <CalendarView />
            </CurrentScheduleProvider>
          </ProtectedRoute>
        } />
        <Route path='/requiresPotentialSchedule/SchedulePicker' element={
          <ProtectedRoute>
            <CurrentScheduleProvider>
            <PotentialScheduleProvider>
              <SchedulePicker />
            </PotentialScheduleProvider>
            </CurrentScheduleProvider>
          </ProtectedRoute>
        } />
        <Route path='/requiresPotentialSchedule/EventSelection' element={
          <ProtectedRoute>
            <CurrentScheduleProvider>
            <PotentialScheduleProvider>
              <EventSelection />
            </PotentialScheduleProvider>
            </CurrentScheduleProvider>
          </ProtectedRoute>
        } />
        <Route path='/requiresPotentialSchedule/CalendarViewPotential' element={
          <ProtectedRoute>
            <CurrentScheduleProvider>
              <PotentialScheduleProvider>
                <CalendarViewPotential />
              </PotentialScheduleProvider>
            </CurrentScheduleProvider>
          </ProtectedRoute>
        } />
        <Route path='/requiresPotentialSchedule/RescheduleScreen' element={
          <ProtectedRoute>
            <CurrentScheduleProvider>
              <PotentialScheduleProvider>
                <RescheduleScreen />
              </PotentialScheduleProvider>
            </CurrentScheduleProvider>
          </ProtectedRoute>
        } /> */}
			</Routes>
		</Router>
	);
};

export default App;
