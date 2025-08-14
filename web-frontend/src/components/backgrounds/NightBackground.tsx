import React from 'react';

const NightBackground: React.FC = () => {
  return (
    <div className="night-star-layer" aria-hidden>
      {/* Varied Pixel Stars */}
      <div className="pixel-stars-large" />
      <div className="pixel-stars-medium" />
      <div className="pixel-stars-small" />
      <div className="pixel-stars-plus" />
      <div className="pixel-stars-diamond" />
      {/* Simple Pixel Crescent Moon */}
      <div className="moon-crescent-pixel" />
      
      {/* Night City Skyline */}
      <div className="night-buildings">
        {/* Building 1 - Tall left building */}
        <div className="building building-1">
          <div className="building-windows">
            {Array.from({ length: 18 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
        
        {/* Building 2 - Medium building */}
        <div className="building building-2">
          <div className="building-windows">
            {Array.from({ length: 13 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
        
        {/* Building 3 - Tallest building */}
        <div className="building building-3">
          <div className="building-windows">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
        
        {/* Building 4 */}
        <div className="building building-4">
          <div className="building-windows">
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
        
        {/* Building 5 */}
        <div className="building building-5">
          <div className="building-windows">
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
        
        {/* Building 6 */}
        <div className="building building-6">
          <div className="building-windows">
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
        
        {/* Building 7 */}
        <div className="building building-7">
          <div className="building-windows">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
        
        {/* Building 8 */}
        <div className="building building-8">
          <div className="building-windows">
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
        
        {/* Building 9 */}
        <div className="building building-9">
          <div className="building-windows">
            {Array.from({ length: 15 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
        
        {/* Building 10 */}
        <div className="building building-10">
          <div className="building-windows">
            {Array.from({ length: 17 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
        
        {/* Building 11 */}
        <div className="building building-11">
          <div className="building-windows">
            {Array.from({ length: 18 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
        
        {/* Building 12 */}
        <div className="building building-12">
          <div className="building-windows">
            {Array.from({ length: 14 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
        
        {/* Building 13 */}
        <div className="building building-13">
          <div className="building-windows">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
        
        {/* Building 14 */}
        <div className="building building-14">
          <div className="building-windows">
            {Array.from({ length: 13 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
        
        {/* Building 15 */}
        <div className="building building-15">
          <div className="building-windows">
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className="window" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default NightBackground;
