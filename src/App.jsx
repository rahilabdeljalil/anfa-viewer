// App.jsx
import React, { useState, createContext, useContext } from 'react';
import Navbar from './components/Navbar';
import LeftControls from './components/LeftControls';
import ViewerModule from './components/ViewerModule';
import RightInfo from './components/RightInfo';
import CursorCircles from './components/CursorCircles';
import './styles/main.css';

// Create a FrameContext to hold the current frame
const FrameContext = createContext();

// Custom hook to access frame context
export const useFrameContext = () => useContext(FrameContext);

const App = () => {
  const [activeView, setActiveView] = useState('aerienne');
  const [currentFrame, setCurrentFrame] = useState(1);  // Store current frame

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  return (
    <FrameContext.Provider value={{ currentFrame, setCurrentFrame }}>
      <div className="app-container">
        <CursorCircles />
        <Navbar />
        <div className="main-content">
          <div className="content-container">
            <LeftControls onViewChange={handleViewChange} />
            <ViewerModule activeView={activeView} />
            <RightInfo activeView={activeView} />
          </div>
        </div>
        <div className="background-illustration"></div>
      </div>
    </FrameContext.Provider>
  );
};

export default App;
