import React, { useState, useEffect, useRef, useCallback, useMemo, useReducer } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag, usePinch } from 'react-use-gesture';
import { useFrameContext } from '../App'; // Importing the frame context from App.jsx

// Reducer for managing related states
const viewerStateReducer = (state, action) => {
  switch (action.type) {
    case 'IMAGE_LOADING':
      return { ...state, imageLoaded: false, imageError: false };
    case 'IMAGE_LOADED':
      return { ...state, imageLoaded: true, lowResVisible: false };
    case 'IMAGE_ERROR':
      return { ...state, imageError: true };
    case 'LOW_RES_LOADED':
      return { ...state, lowResLoaded: true };
    case 'SET_DRAGGING':
      return { ...state, isDragging: action.payload };
    case 'FIRST_LOAD_COMPLETE':
      return { ...state, firstLoadComplete: true };
    case 'HIDE_GUIDE':
      return { ...state, showGuide: false };
    default:
      return state;
  }
};

const ViewerModule = ({ activeView }) => {
  // Configuration
  const totalFrames = 140; // Total frames for the image sequence
  const dragSensitivity = 15; // Higher number = less sensitive
  const preloadRange = 5; // Number of frames to preload in each direction
  const enableMomentum = false; // Set to false to disable momentum (auto-spinning)

  // References
  const containerRef = useRef(null); // Reference to container
  const lastPosition = useRef({ x: 0, y: 0 }); // Track both x and y positions
  const imageCache = useRef(new Map()); // Cache for loaded images
  const lastFrameUpdateTime = useRef(0); // To throttle frame updates
  const lastDirection = useRef(0); // Track drag direction
  const lastDragTime = useRef(Date.now()); // For momentum calculation
  const momentumRef = useRef(0); // Current momentum value
  const animationFrameId = useRef(null); // For animation frame cleanup

  // Accessing the frame context from App.jsx
  const { currentFrame, setCurrentFrame } = useFrameContext();

  // State reducer for viewer states
  const [viewerState, dispatch] = useReducer(viewerStateReducer, {
    imageLoaded: false,
    imageError: false,
    lowResLoaded: false,
    isDragging: false,
    firstLoadComplete: false,
    showGuide: !localStorage.getItem('viewerGuideShown')
  });

  // Additional states
  const [momentum, setMomentum] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Image sequence path patterns
  const viewPathPatterns = {
    aerienne: '/assets/sequences/aerial/aerial/{frame}.webp',
    villas: '/assets/sequences/villas/villas/{frame}.webp',
    parcelles: '/assets/sequences/Parcelles/{frame}.webp',
  };

  // Low-res path patterns for fast loading
  const lowResPathPatterns = {
    aerienne: '/assets/sequences/aerial/aerial/low/{frame}.webp',
    villas: '/assets/sequences/villas/villas/low/{frame}.webp',
    parcelles: '/assets/sequences/Parcelles/low/{frame}.webp',
  };

  // Spring animation for zoom
  const [{ zoom }, setZoom] = useSpring(() => ({
    zoom: 1.7,
    config: { mass: 1, tension: 300, friction: 40 },
  }));

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Effective drag sensitivity based on device
  const effectiveDragSensitivity = useMemo(() => 
    isMobile ? dragSensitivity * 0.7 : dragSensitivity, 
  [isMobile, dragSensitivity]);

  // Memoized image paths to prevent unnecessary re-renders
  const { currentImagePath, currentLowResPath } = useMemo(() => {
    const paddedFrame = String(currentFrame).padStart(4, '0');
    return {
      currentImagePath: viewPathPatterns[activeView].replace('{frame}', paddedFrame),
      currentLowResPath: lowResPathPatterns[activeView].replace('{frame}', paddedFrame)
    };
  }, [currentFrame, activeView, viewPathPatterns, lowResPathPatterns]);

  // Function to preload nearby frames with directional bias
  const preloadNearbyFrames = useCallback((frame, range = preloadRange) => {
    // Load more frames in the direction user is dragging
    const forwardRange = lastDirection.current > 0 ? range + 3 : range;
    const backwardRange = lastDirection.current < 0 ? range + 3 : range;
    
    for (let i = -backwardRange; i <= forwardRange; i++) {
      if (i === 0) continue;
      let frameToLoad = frame + i;

      // Handle wrapping
      if (frameToLoad > totalFrames) {
        frameToLoad = frameToLoad - totalFrames;
      } else if (frameToLoad < 1) {
        frameToLoad = totalFrames + frameToLoad;
      }

      const paddedFrame = String(frameToLoad).padStart(4, '0');
      const path = viewPathPatterns[activeView].replace('{frame}', paddedFrame);

      if (!imageCache.current.has(path)) {
        const img = new Image();
        img.src = path;
        imageCache.current.set(path, img);
      }
    }
  }, [activeView, totalFrames, viewPathPatterns, preloadRange]);

  // Use requestAnimationFrame for smoother frame updates
  const updateFrame = useCallback((newFrameOrFunction) => {
    const now = Date.now();
    if (now - lastFrameUpdateTime.current < 16) return; // Limit to ~60fps

    lastFrameUpdateTime.current = now;

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    animationFrameId.current = requestAnimationFrame(() => {
      if (typeof newFrameOrFunction === 'function') {
        setCurrentFrame(prevFrame => {
          const newFrame = newFrameOrFunction(prevFrame);
          // Ensure frame is within bounds and handle wrapping
          if (newFrame > totalFrames) {
            return newFrame % totalFrames || totalFrames;
          } else if (newFrame < 1) {
            return totalFrames - Math.abs(newFrame % totalFrames);
          }
          return newFrame;
        });
      } else {
        // Direct frame number provided
        let frameToSet = newFrameOrFunction;
        if (frameToSet > totalFrames) {
          frameToSet = frameToSet % totalFrames || totalFrames;
        } else if (frameToSet < 1) {
          frameToSet = totalFrames - Math.abs(frameToSet % totalFrames);
        }
        setCurrentFrame(frameToSet);
      }
    });
  }, [setCurrentFrame, totalFrames]);

  // Load cached frames from localStorage on initial load
  useEffect(() => {
    const cacheKey = `viewer-cache-${activeView}`;
    const persistCache = localStorage.getItem(cacheKey);
    
    if (persistCache) {
      try {
        const cachedFrames = JSON.parse(persistCache);
        // Pre-populate cache with information about previously loaded frames
        cachedFrames.forEach(frame => {
          if (!imageCache.current.has(frame)) {
            const img = new Image();
            img.src = frame;
            imageCache.current.set(frame, img);
          }
        });
      } catch (e) {
        console.error('Error parsing cache:', e);
        localStorage.removeItem(cacheKey);
      }
    }
    
    // Reset states when view changes
    dispatch({ type: 'IMAGE_LOADING' });
    lastPosition.current = { x: 0, y: 0 };
    
    return () => {
      // Save cache on unmount
      try {
        const cacheKeys = Array.from(imageCache.current.keys()).slice(0, 50); // Limit cache size
        localStorage.setItem(cacheKey, JSON.stringify(cacheKeys));
      } catch (e) {
        console.error('Error saving cache:', e);
      }
    };
  }, [activeView]);

  // Effect for handling momentum scrolling (only if enabled)
  useEffect(() => {
    if (!enableMomentum || Math.abs(momentum) < 0.1) return;
    
    const momentumTimer = setInterval(() => {
      setMomentum(current => {
        // Decay momentum over time
        const newMomentum = current * 0.95;
        
        // Apply momentum to frame navigation
        if (Math.abs(newMomentum) > 0.1) {
          const framesToMove = Math.min(1, Math.round(Math.abs(newMomentum))); // Reduced from 3 to 1
          const direction = newMomentum > 0 ? -1 : 1;
          lastDirection.current = direction;
          
          updateFrame(prev => prev + (direction * framesToMove));
        }
        
        return Math.abs(newMomentum) < 0.1 ? 0 : newMomentum;
      });
    }, 16); // ~60fps
    
    return () => clearInterval(momentumTimer);
  }, [momentum, updateFrame, enableMomentum]);

  // Preload initial frames and critical frames when component mounts
  useEffect(() => {
    if (!viewerState.firstLoadComplete) {
      // Show a loading screen while preloading critical frames
      const criticalFrames = [
        1, 
        Math.round(totalFrames * 0.25), 
        Math.round(totalFrames * 0.5), 
        Math.round(totalFrames * 0.75), 
        totalFrames
      ];
      
      let loadedCount = 0;
      
      const preloadComplete = () => {
        loadedCount++;
        if (loadedCount >= criticalFrames.length) {
          dispatch({ type: 'FIRST_LOAD_COMPLETE' });
        }
      };
      
      criticalFrames.forEach(frame => {
        const paddedFrame = String(frame).padStart(4, '0');
        const path = viewPathPatterns[activeView].replace('{frame}', paddedFrame);
        
        if (imageCache.current.has(path)) {
          preloadComplete();
          return;
        }
        
        const img = new Image();
        img.onload = preloadComplete;
        img.onerror = preloadComplete; // Continue even if some images fail
        img.src = path;
        imageCache.current.set(path, img);
        
        // Also load low-res version
        const lowResPath = lowResPathPatterns[activeView].replace('{frame}', paddedFrame);
        const lowResImg = new Image();
        lowResImg.src = lowResPath;
      });
    }
  }, [activeView, viewPathPatterns, lowResPathPatterns, totalFrames, viewerState.firstLoadComplete]);

  // Preload nearby frames whenever current frame changes
  useEffect(() => {
    preloadNearbyFrames(currentFrame);
  }, [currentFrame, preloadNearbyFrames]);

  // Handle keydown events for frame navigation and zoom
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowLeft':
        lastDirection.current = -1;
        updateFrame(currentFrame > 1 ? currentFrame - 1 : totalFrames);
        break;
      case 'ArrowRight':
        lastDirection.current = 1;
        updateFrame(currentFrame < totalFrames ? currentFrame + 1 : 1);
        break;
      case 'ArrowUp':
        setZoom.start({ zoom: Math.min(5, zoom.get() + 0.1) });
        break;
      case 'ArrowDown':
        setZoom.start({ zoom: Math.max(0.5, zoom.get() - 0.1) });
        break;
      default:
        break;
    }
  }, [currentFrame, totalFrames, updateFrame, zoom, setZoom]);

  // Add event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Clean up any animation frames
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [handleKeyDown]);

  // Handle mouseup event to fix cases where mouse leaves window during drag
  useEffect(() => {
    const handleMouseUp = () => {
      dispatch({ type: 'SET_DRAGGING', payload: false });
      lastPosition.current = { x: 0, y: 0 };
      // Reset momentum when mouse up
      setMomentum(0);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Optimized drag handler
  const bindDrag = useDrag(
    ({ first, last, xy: [x, y], down, movement: [mx], event }) => {
      if (event) event.preventDefault();

      if (first) {
        dispatch({ type: 'SET_DRAGGING', payload: true });
        lastPosition.current = { x, y };
        lastDragTime.current = Date.now();
        momentumRef.current = 0;
      }

      if (down) {
        const now = Date.now();
        const deltaTime = now - lastDragTime.current;
        const deltaX = x - lastPosition.current.x;
        
        if (deltaTime > 0) {
          // Calculate velocity (pixels per ms)
          momentumRef.current = deltaX / deltaTime;
        }
        
        // Only process if there's significant horizontal movement
        if (Math.abs(deltaX) >= effectiveDragSensitivity) {
          const direction = deltaX > 0 ? -1 : 1;
          lastDirection.current = direction;
          
          const framesToMove = Math.floor(Math.abs(deltaX) / effectiveDragSensitivity);
          if (framesToMove > 0) {
            updateFrame(prevFrame => prevFrame + (direction * framesToMove));
            lastPosition.current = { x, y };
          }
        }
        
        lastDragTime.current = now;
      }

      if (last) {
        dispatch({ type: 'SET_DRAGGING', payload: false });
        lastPosition.current = { x: 0, y: 0 };
        
        // Apply momentum when drag ends (only if enabled)
        if (enableMomentum) {
          setMomentum(momentumRef.current * 5); // Reduced from 15 to 5
        } else {
          setMomentum(0); // No momentum
        }
      }
    },
    {
      filterTaps: true,
      threshold: 3,
      pointer: { touch: true },
    }
  );

  // Pinch gesture for zooming
  const bindPinch = usePinch(
    ({ offset: [d] }) => {
      setZoom.start({ zoom: Math.max(0.5, Math.min(5, d)) });
    },
    {
      from: [zoom.get(), 0],
    }
  );

  // Wheel event for zooming
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom.start({
      zoom: Math.max(0.5, Math.min(5, zoom.get() + (e.deltaY < 0 ? 0.1 : -0.1))),
    });
  }, [zoom, setZoom]);

  // Mark when the guide is dismissed
  const dismissGuide = useCallback(() => {
    dispatch({ type: 'HIDE_GUIDE' });
    localStorage.setItem('viewerGuideShown', 'true');
  }, []);

  return (
    <div
      {...bindDrag()}
      {...bindPinch()}
      ref={containerRef}
      className="viewer-module"
      style={{
        cursor: viewerState.isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onWheel={handleWheel}
      onTouchStart={() => dispatch({ type: 'SET_DRAGGING', payload: true })}
      onTouchEnd={() => {
        dispatch({ type: 'SET_DRAGGING', payload: false });
        lastPosition.current = { x: 0, y: 0 };
        setMomentum(0); // Reset momentum on touch end
      }}
      onMouseDown={() => dispatch({ type: 'SET_DRAGGING', payload: true })}
      onMouseUp={() => {
        dispatch({ type: 'SET_DRAGGING', payload: false });
        lastPosition.current = { x: 0, y: 0 };
        setMomentum(0); // Reset momentum on mouse up
      }}
      onMouseLeave={() => {
        dispatch({ type: 'SET_DRAGGING', payload: false });
        lastPosition.current = { x: 0, y: 0 };
        setMomentum(0); // Reset momentum on mouse leave
      }}
      aria-label={`Interactive viewer for ${activeView} view`}
      role="application"
    >
      <animated.div className="viewer-content" style={{ scale: zoom, touchAction: 'none' }}>
        {/* Low-res placeholder that shows while high-res is loading */}
        {!viewerState.imageLoaded && (
          <img
            src={currentLowResPath}
            alt=""
            className="low-res-placeholder"
            style={{ opacity: viewerState.imageLoaded ? 0 : 1 }}
            onLoad={() => dispatch({ type: 'LOW_RES_LOADED' })}
            draggable={false}
          />
        )}
        
        {/* Main high-res image */}
        <img
          src={currentImagePath}
          alt={`View ${activeView} (${currentFrame}/${totalFrames})`}
          className={`viewer-image ${viewerState.imageLoaded ? 'loaded' : 'loading'}`}
          onLoad={() => dispatch({ type: 'IMAGE_LOADED' })}
          onError={() => dispatch({ type: 'IMAGE_ERROR' })}
          draggable={false}
          style={{ opacity: viewerState.imageLoaded ? 1 : 0 }}
        />
        
        {/* Error state */}
        {viewerState.imageError && (
          <div className="image-error" role="alert">
            <span className="error-icon" aria-hidden="true">⚠️</span>
            <p className="error-text">Image not available</p>
            <button 
              className="retry-button" 
              onClick={() => {
                dispatch({ type: 'IMAGE_LOADING' });
                // Force reload by removing from cache
                imageCache.current.delete(currentImagePath);
                // Create a new image element to trigger reload
                const img = new Image();
                img.src = currentImagePath + '?retry=' + Date.now();
                imageCache.current.set(currentImagePath, img);
              }}
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Loading state */}
        {!viewerState.imageLoaded && !viewerState.lowResLoaded && !viewerState.imageError && (
          <div className="loading-overlay" aria-live="polite">
            <div className="loading-container">
              <div className="loading-spinner" aria-hidden="true"></div>
              <p className="loading-text">Loading...</p>
              <div className="loading-progress-bar" role="progressbar" aria-valuenow={(currentFrame / totalFrames) * 100} aria-valuemin="0" aria-valuemax="100">
                <div
                  className="loading-progress-fill"
                  style={{ width: `${(currentFrame / totalFrames) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </animated.div>

      {/* Zoom controls */}
      <div className="zoom-controls" role="group" aria-label="Zoom controls">
        <button
          className="zoom-btn zoom-in"
          onClick={() => setZoom.start({ zoom: Math.min(5, zoom.get() + 0.1) })}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          className="zoom-btn zoom-out"
          onClick={() => setZoom.start({ zoom: Math.max(0.5, zoom.get() - 0.1) })}
          aria-label="Zoom out"
        >
          -
        </button>
      </div>

      {/* Frame counter */}
      <div className="frame-counter" aria-live="polite" aria-atomic="true">
        {currentFrame}/{totalFrames}
      </div>

      {/* Sidebar controls */}
      <div className="sidebar" role="complementary">
        <label htmlFor="frame-slider">Frame:</label>
        <input
          id="frame-slider"
          type="range"
          min="1"
          max={totalFrames}
          value={currentFrame}
          onChange={(e) => updateFrame(parseInt(e.target.value, 10))}
          aria-valuemin="1"
          aria-valuemax={totalFrames}
          aria-valuenow={currentFrame}
          aria-label="Frame slider"
        />
      </div>
      
      {/* First-time user guide */}
      {viewerState.showGuide && viewerState.firstLoadComplete && (
        <div 
          className="usage-guide-overlay" 
          onClick={dismissGuide}
          role="dialog"
          aria-label="Usage guide"
        >
          <div className="guide-content" onClick={e => e.stopPropagation()}>
            <h3>How to use the viewer</h3>
            <div className="guide-item">
              <span className="guide-icon" aria-hidden="true">👆</span>
              <span>Drag horizontally to navigate frames</span>
            </div>
            <div className="guide-item">
              <span className="guide-icon" aria-hidden="true">🔍</span>
              <span>Pinch or use buttons to zoom</span>
            </div>
            <div className="guide-item">
              <span className="guide-icon" aria-hidden="true">⌨️</span>
              <span>Use arrow keys to navigate</span>
            </div>
            <button className="guide-dismiss" onClick={dismissGuide}>Got it!</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewerModule;