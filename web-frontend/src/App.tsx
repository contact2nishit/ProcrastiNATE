import React from 'react';
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login';
import Signup from './pages/Signup';
import { CurrentScheduleProvider } from './context/CurrentScheduleContext';
import { PotentialScheduleProvider } from './context/PotentialScheduleContext';
import Home from './pages/Home';
import CalendarView from './pages/CalendarView';
import SchedulePicker from './pages/SchedulePicker';
import EventSelection from './pages/EventSelection';
import CalendarViewPotential from './pages/CalendarViewPotential';
import RescheduleScreen from './pages/RescheduleScreen';

// Badge components for preview
import TaskSlayerBadge from './assets/task-slayer';
import LegendOfGrindingBadge from './assets/legend-of-grinding';
import MotivatedBadge from './assets/motivated';
import HardWorkerBadge from './assets/hard-worker';
import GrinderExpertBadge from './assets/grinder-expert';
import HomeHeroBadge from './assets/home-hero';
import RedemptionBadge from './assets/redemption';
import BadgeFirstTimer from './assets/first-timer';
import BadgeWeekendWarrior from './assets/weekend-warrior';
import BadgeConsistencyKing from './assets/consistency-king';
import BadgeNightOwl from './assets/night-owl';
import BadgeFocusBeast from './assets/focus-beast';
import BadgeEarlyBird from './assets/early-bird';
import BadgeDailyGrinder from './assets/daily-grinder';
import BadgeHumbleBeginner from './assets/humble-beginner';
import BadgeSevenDayStreak from './assets/seven-day-streak';
import BadgeSleepIsForTheWeak from './assets/sleep-is-for-the-weak';
import BadgeGettingTheHangOfIt from './assets/getting-the-hang-of-it';
import BadgeMakingProgress from './assets/making-progress';
import BadgePowerHour from './assets/power-hour';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const token = localStorage.getItem("token");
	return token ? <>{children}</> : <Navigate to="/" replace />;
};

// Badge Preview Component
const BadgePreview: React.FC = () => {
	return (
		<div style={{ 
			padding: '40px', 
			background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
			minHeight: '100vh',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center'
		}}>
			<h1 style={{ 
				color: '#fff', 
				fontSize: '36px', 
				marginBottom: '40px',
				textAlign: 'center',
				textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
			}}>
				Achievement Badges Preview
			</h1>
			<div style={{ 
				display: 'grid', 
				gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
				gap: '50px',
				width: '100%',
				maxWidth: '1800px',
				justifyItems: 'center'
			}}>
				{/* Task Slayer Variants */}
				<div style={{ textAlign: 'center' }}>
					<TaskSlayerBadge variant={1} />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Task Slayer I</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<TaskSlayerBadge variant={2} />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Task Slayer II</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<TaskSlayerBadge variant={3} />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Task Slayer III</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<TaskSlayerBadge variant={4} />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Task Slayer IV</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<TaskSlayerBadge variant={5} />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Task Slayer V</p>
				</div>
				
				{/* Home Hero Variants */}
				<div style={{ textAlign: 'center' }}>
					<HomeHeroBadge variant={1} />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Home Hero I</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<HomeHeroBadge variant={2} />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Home Hero II</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<HomeHeroBadge variant={3} />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Home Hero III</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<HomeHeroBadge variant={4} />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Home Hero IV</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<HomeHeroBadge variant={5} />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Home Hero V</p>
				</div>
				
				{/* Other Newly Created Badges */}
				<div style={{ textAlign: 'center' }}>
					<LegendOfGrindingBadge />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Legend of Grinding</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<MotivatedBadge />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Motivated</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<HardWorkerBadge />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Hard Worker</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<GrinderExpertBadge />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Grinder Expert</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<RedemptionBadge />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Redemption</p>
				</div>

				{/* Existing Badges */}
				<div style={{ textAlign: 'center' }}>
					<BadgeFirstTimer />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>First Timer</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<BadgeWeekendWarrior />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Weekend Warrior</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<BadgeConsistencyKing />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Consistency King</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<BadgeNightOwl />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Night Owl</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<BadgeFocusBeast />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Focus Beast</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<BadgeEarlyBird />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Early Bird</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<BadgeDailyGrinder />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Daily Grinder</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<BadgeHumbleBeginner />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Humble Beginner</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<BadgeSevenDayStreak />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Seven Day Streak</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<BadgeSleepIsForTheWeak />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Sleep Is For The Weak</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<BadgeGettingTheHangOfIt />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Getting The Hang Of It</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<BadgeMakingProgress />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Making Progress</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<BadgePowerHour />
					<p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>Power Hour</p>
				</div>
			</div>
		</div>
	);
};


const App: React.FC = () => {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<BadgePreview />} />
				{/* <Route path="/" element={<Login />} /> */}
				<Route path="/signup" element={<Signup />} />
				<Route path='/requiresCurrentSchedule/Home' element={
					<ProtectedRoute>
						<CurrentScheduleProvider>
							<Home />
						</CurrentScheduleProvider>
					</ProtectedRoute>
					}
				/>
				<Route path='requiresCurrentSchedule/requiresPotentialSchedule/EventSelection' element={
					<ProtectedRoute>
						<CurrentScheduleProvider>
						<PotentialScheduleProvider>
							<EventSelection />
						</PotentialScheduleProvider>
						</CurrentScheduleProvider>
					</ProtectedRoute>
				} />
				<Route path='requiresCurrentSchedule/requiresPotentialSchedule/SchedulePicker' element={
					<ProtectedRoute>
						<CurrentScheduleProvider>
							<PotentialScheduleProvider>
								<SchedulePicker />
							</PotentialScheduleProvider>
						</CurrentScheduleProvider>
					</ProtectedRoute>
				} />
				<Route path='requiresCurrentSchedule/requiresPotentialSchedule/RescheduleScreen' element={
					<ProtectedRoute>
						<CurrentScheduleProvider>
							<PotentialScheduleProvider>
								<RescheduleScreen />
							</PotentialScheduleProvider>
						</CurrentScheduleProvider>
					</ProtectedRoute>
        		} />
				<Route path='/requiresCurrentSchedule/CalendarView' element={
					<ProtectedRoute>
						<CurrentScheduleProvider>
							<CalendarView />
						</CurrentScheduleProvider>
					</ProtectedRoute>
				} />      
        <Route path='requiresCurrentSchedule/requiresPotentialSchedule/CalendarViewPotential' element={
          <ProtectedRoute>
            <CurrentScheduleProvider>
              <PotentialScheduleProvider>
                <CalendarViewPotential />
              </PotentialScheduleProvider>
            </CurrentScheduleProvider>
          </ProtectedRoute>
        } />
			</Routes>
		</Router>
	);
};

export default App;
