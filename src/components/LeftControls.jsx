import React, { useState } from 'react';
import '../styles/main.css';

const LeftControls = ({ onViewChange }) => {
  const [activeView, setActiveView] = useState('aerienne');

  const handleViewChange = (view) => {
    setActiveView(view);
    onViewChange(view);
  };

  return (
    <div className="left-controls">
      <button 
        className={`control-btn ${activeView === 'aerienne' ? 'active' : ''}`}
        onClick={() => handleViewChange('aerienne')}
      >
        Aérienne
      </button>
      <button 
        className={`control-btn ${activeView === 'villas' ? 'active' : ''}`}
        onClick={() => handleViewChange('villas')}
      >
        Villas
      </button>
      <button 
        className={`control-btn ${activeView === 'parcelles' ? 'active' : ''}`}
        onClick={() => handleViewChange('parcelles')}
      >
        Parcelles
      </button>
    </div>
  );
};

export default LeftControls;