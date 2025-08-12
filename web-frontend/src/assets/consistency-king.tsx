import React from 'react';
import './styling/consistency-king.css';

const BadgeConsistencyKing: React.FC = () => {
  return (
    <div className="badge-container-consistency-king">
      <div className="explosion-consistency-king">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="explosion-particle-consistency-king"></div>
        ))}
      </div>

      <div className="badge-consistency-king">
        <div className="inner-ring-consistency-king"></div>
        <div className="mega-shine-consistency-king"></div>

        <div className="particles-consistency-king">
          <div className="particle-consistency-king">👑</div>
          <div className="particle-consistency-king">💎</div>
          <div className="particle-consistency-king">✨</div>
          <div className="particle-consistency-king">👑</div>
          <div className="particle-consistency-king">💎</div>
          <div className="particle-consistency-king">✨</div>
        </div>

        <div className="crown-container-consistency-king">
          <div className="crown-consistency-king">
            <div className="crown-band-consistency-king"></div>
            <div className="crown-arches-consistency-king">
              <div className="arch-consistency-king arch-1"></div>
              <div className="arch-consistency-king arch-2"></div>
              <div className="arch-consistency-king arch-3"></div>
              <div className="arch-consistency-king arch-4"></div>
            </div>
            <div className="crown-cross-consistency-king">
              <div className="cross-vertical-consistency-king"></div>
              <div className="cross-horizontal-consistency-king"></div>
            </div>
            <div className="crown-orb-consistency-king"></div>
            <div className="crown-gems-consistency-king">
              <div className="gem-consistency-king gem-1"></div>
              <div className="gem-consistency-king gem-2"></div>
              <div className="gem-consistency-king gem-3"></div>
              <div className="gem-consistency-king gem-4"></div>
            </div>
          </div>
        </div>

        <div className="big-text-consistency-king">CONSISTENCY</div>
        <div className="label-consistency-king">KING!</div>
      </div>
    </div>
  );
};

export default BadgeConsistencyKing;