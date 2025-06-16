import React, { useState, useEffect } from 'react';
import '../styles/main.css';

const CursorCircles = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Add a slight delay for a smoother trailing effect
      setTimeout(() => {
        setPosition({ x: e.clientX, y: e.clientY });
      }, 15);
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div 
        className="cursor-circle-outer"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      ></div>
      <div 
        className="cursor-circle-inner"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      ></div>
    </>
  );
};

export default CursorCircles;