// App.jsx
import React, { createContext, useState, useContext } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag, usePinch } from 'react-use-gesture';
import './styles/main.css';

// Create the context
const FrameContext = createContext();

// Custom hook to use the frame context
const useFrameContext = () => useContext(FrameContext);

const App = () => {
  return (
    <FrameProvider>
      <ViewerModule activeView="aerienne" />
      {/* Other components can be added here */}
    </FrameProvider>
  );
};

// Frame Provider to wrap the app and provide frame state
const FrameProvider = ({ children }) => {
  const [currentFrame, setCurrentFrame] = useState(1); // Default frame is 1
  return (
    <FrameContext.Provider value={{ currentFrame, setCurrentFrame }}>
      {children}
    </FrameContext.Provider>
  );
};
