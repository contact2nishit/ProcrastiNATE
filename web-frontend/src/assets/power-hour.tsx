import React from 'react';
import './styling/power-hour.css';

const BadgePowerHour: React.FC = () => {
  return (
    <div className="badge-container-power-hour">
      <div className="explosion-power-hour">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="explosion-particle-power-hour"></div>
        ))}
      </div>

      <div className="badge-power-hour">
        <div className="inner-ring-power-hour"></div>
        <div className="mega-shine-power-hour"></div>

        <div className="particles-power-hour">
          <div className="particle-power-hour">⚡</div>
          <div className="particle-power-hour">🕐</div>
          <div className="particle-power-hour">🔋</div>
          <div className="particle-power-hour">⚡</div>
          <div className="particle-power-hour">🕐</div>
          <div className="particle-power-hour">🔋</div>
        </div>

        <div className="trophy-container-power-hour">
          <div className="time-machine-power-hour">
            <div className="energy-orb-power-hour">
              <div className="orb-core-power-hour">60</div>
              <div className="energy-ring-power-hour outer"></div>
              <div className="energy-ring-power-hour middle"></div>
              <div className="energy-ring-power-hour inner"></div>
            </div>
            <div className="clock-hands-power-hour">
              <div className="hour-hand-power-hour"></div>
              <div className="minute-hand-power-hour"></div>
              <div className="second-hand-power-hour"></div>
            </div>
            <div className="time-markers-power-hour">
              <div className="marker-power-hour"></div>
              <div className="marker-power-hour"></div>
              <div className="marker-power-hour"></div>
              <div className="marker-power-hour"></div>
              <div className="marker-power-hour"></div>
              <div className="marker-power-hour"></div>
              <div className="marker-power-hour"></div>
              <div className="marker-power-hour"></div>
              <div className="marker-power-hour"></div>
              <div className="marker-power-hour"></div>
              <div className="marker-power-hour"></div>
              <div className="marker-power-hour"></div>
            </div>
            <div className="power-turbines-power-hour">
              <div className="turbine-power-hour left">
                <div className="turbine-blade-power-hour"></div>
                <div className="turbine-blade-power-hour"></div>
                <div className="turbine-blade-power-hour"></div>
              </div>
              <div className="turbine-power-hour right">
                <div className="turbine-blade-power-hour"></div>
                <div className="turbine-blade-power-hour"></div>
                <div className="turbine-blade-power-hour"></div>
              </div>
            </div>
            <div className="lightning-bolts-power-hour">
              <div className="lightning-power-hour top"></div>
              <div className="lightning-power-hour bottom"></div>
              <div className="lightning-power-hour left"></div>
              <div className="lightning-power-hour right"></div>
            </div>
          </div>
        </div>

        <div className="big-text-power-hour">POWER</div>
        <div className="label-power-hour">HOUR</div>
      </div>
    </div>
  );
};

export default BadgePowerHour;