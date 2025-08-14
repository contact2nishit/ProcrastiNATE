import React from 'react';

const DayBackground: React.FC = () => {
  return (
    <div className="day-cloud-layer" aria-hidden>
        {/* Pixel Clouds (downsized) */}
        <div className="absolute" style={{ top: '5rem', right: '3rem', width: '90px', height: '60px', background: 'white', opacity: 0.8, clipPath: 'polygon(0 0, 8% 0, 8% 22%, 23% 22%, 23% 0, 69% 0, 69% 17%, 85% 17%, 85% 44%, 92% 44%, 92% 67%, 77% 67%, 77% 83%, 46% 83%, 46% 100%, 15% 100%, 15% 78%, 0 78%)' }} />
        <div className="absolute" style={{ top: '9rem', left: '4rem', width: '75px', height: '48px', background: 'white', opacity: 0.75, clipPath: 'polygon(0 0, 14% 0, 14% 29%, 27% 29%, 27% 0, 73% 0, 73% 21%, 86% 21%, 86% 57%, 100% 57%, 100% 79%, 73% 79%, 73% 100%, 27% 100%, 27% 71%, 0 71%)' }} />
        <div className="absolute" style={{ top: '13rem', left: '7rem', width: '56px', height: '36px', background: 'white', opacity: 0.6, clipPath: 'polygon(0 0, 13% 0, 13% 30%, 31% 30%, 31% 0, 69% 0, 69% 20%, 88% 20%, 88% 60%, 100% 60%, 100% 80%, 69% 80%, 69% 100%, 31% 100%, 31% 70%, 0 70%)' }} />
        <div className="absolute" style={{ top: '6rem', right: '6rem', width: '50px', height: '30px', background: 'white', opacity: 0.55, clipPath: 'polygon(0 0, 14% 0, 14% 38%, 29% 38%, 29% 0, 71% 0, 71% 25%, 86% 25%, 86% 63%, 100% 63%, 100% 88%, 71% 88%, 71% 100%, 29% 100%, 29% 75%, 0 75%)' }} />
        <div className="absolute" style={{ top: '8rem', left: '66%', width: '40px', height: '20px', background: 'white', opacity: 0.45, clipPath: 'polygon(0 0, 20% 0, 20% 40%, 40% 40%, 40% 0, 80% 0, 80% 20%, 100% 20%, 100% 80%, 60% 80%, 60% 100%, 20% 100%, 20% 60%, 0 60%)' }} />
        <div className="absolute" style={{ top: '3rem', right: '33%', width: '32px', height: '16px', background: 'white', opacity: 0.48, clipPath: 'polygon(0 0, 25% 0, 25% 50%, 50% 50%, 50% 0, 75% 0, 75% 25%, 100% 25%, 100% 75%, 75% 75%, 75% 100%, 25% 100%, 25% 75%, 0 75%)' }} />
        <div className="absolute" style={{ top: '2rem', left: '25%', width: '26px', height: '14px', background: 'white', opacity: 0.40, clipPath: 'polygon(0 0, 33% 0, 33% 67%, 67% 67%, 67% 0, 100% 0, 100% 100%, 67% 100%, 67% 67%, 0 67%)' }} />
        <div className="absolute" style={{ top: '12rem', left: '2rem', width: '50px', height: '26px', background: 'white', opacity: 0.42, clipPath: 'polygon(0 0, 17% 0, 17% 33%, 33% 33%, 33% 0, 67% 0, 67% 17%, 83% 17%, 83% 67%, 100% 67%, 100% 83%, 67% 83%, 67% 100%, 33% 100%, 33% 67%, 0 67%)' }} />
        <div className="absolute" style={{ top: '18rem', right: '4rem', width: '40px', height: '22px', background: 'white', opacity: 0.38, clipPath: 'polygon(0 0, 20% 0, 20% 40%, 40% 40%, 40% 0, 80% 0, 80% 20%, 100% 20%, 100% 80%, 60% 80%, 60% 100%, 20% 100%, 20% 60%, 0 60%)' }} />
        {/* Additional clouds */}
        <div className="absolute" style={{ top: '10rem', right: '18%', width: '52px', height: '28px', background: 'white', opacity: 0.43, clipPath: 'polygon(0 0, 18% 0, 18% 33%, 30% 33%, 30% 0, 70% 0, 70% 17%, 82% 17%, 82% 50%, 90% 50%, 90% 67%, 100% 67%, 100% 83%, 70% 83%, 70% 100%, 30% 100%, 30% 67%, 0 67%)' }} />
        <div className="absolute" style={{ top: '4rem', left: '10%', width: '60px', height: '34px', background: 'white', opacity: 0.5, clipPath: 'polygon(0 0, 14% 0, 14% 29%, 27% 29%, 27% 0, 73% 0, 73% 21%, 86% 21%, 86% 57%, 100% 57%, 100% 79%, 73% 79%, 73% 100%, 27% 100%, 27% 71%, 0 71%)' }} />
        <div className="absolute" style={{ top: '16rem', left: '35%', width: '42px', height: '24px', background: 'white', opacity: 0.37, clipPath: 'polygon(0 0, 20% 0, 20% 40%, 40% 40%, 40% 0, 80% 0, 80% 20%, 100% 20%, 100% 80%, 60% 80%, 60% 100%, 20% 100%, 20% 60%, 0 60%)' }} />
        <div className="absolute" style={{ top: '20rem', left: '15%', width: '48px', height: '28px', background: 'white', opacity: 0.41, clipPath: 'polygon(0 0, 17% 0, 17% 33%, 33% 33%, 33% 0, 67% 0, 67% 17%, 83% 17%, 83% 67%, 100% 67%, 100% 83%, 67% 83%, 67% 100%, 33% 100%, 33% 67%, 0 67%)' }} />
        <div className="absolute" style={{ top: '6rem', left: '50%', width: '54px', height: '30px', background: 'white', opacity: 0.44, clipPath: 'polygon(0 0, 8% 0, 8% 22%, 23% 22%, 23% 0, 69% 0, 69% 17%, 85% 17%, 85% 44%, 92% 44%, 92% 67%, 77% 67%, 77% 83%, 46% 83%, 46% 100%, 15% 100%, 15% 78%, 0 78%)' }} />
        {/* Sun Rays ONLY (no sun disc) */}
        {['12deg','25deg','40deg','-10deg','-25deg','-38deg'].map((deg,i)=> (
          <div key={deg} className="absolute" style={{ top: 0, left: '20%', width: '10px', height: '220px', background: 'linear-gradient(to bottom, rgba(255,240,180,0.55), rgba(255,240,180,0.18), transparent)', transform: `rotate(${deg}) translateX(${i*10}px)`, transformOrigin: 'top left', opacity: 0.55, filter: 'blur(0.5px)', boxShadow: '0 0 8px 2px rgba(255,240,190,0.35)' }} />
        ))}
        {['8deg','-5deg','22deg','-18deg','15deg','-30deg'].map((deg,i)=> (
          <div key={'thin'+deg} className="absolute" style={{ top: 0, left: '20%', width: '5px', height: '200px', background: 'linear-gradient(to bottom, rgba(255,250,210,0.65), rgba(255,250,210,0.25), transparent)', transform: `rotate(${deg}) translateX(${i*14 + 6}px)`, transformOrigin: 'top left', opacity: 0.5, filter: 'blur(0.4px)' }} />
        ))}
    </div>
  );
};
export default DayBackground;
