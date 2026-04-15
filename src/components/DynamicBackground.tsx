import React from 'react';
import { motion } from 'framer-motion';

interface DynamicBackgroundProps {
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
  speed?: number;
  opacity?: number;
  blur?: number;
  children?: React.ReactNode;
}

const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  color1 = '#4f46e5', // Indigo
  color2 = '#ec4899', // Pink
  color3 = '#06b6d4', // Cyan
  color4 = '#f59e0b', // Amber
  speed = 10,
  opacity = 0.4,
  blur = 60,
  children,
}) => {
  const duration = 20 / speed;

  return (
    <div className="relative w-full overflow-hidden min-h-[200px]">
      {/* Animated Background Layer */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ opacity }}
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [-20, 20, -20],
          }}
          transition={{
            duration: duration * 2,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-60"
          style={{ 
            background: color1,
            filter: `blur(${blur}px)`,
          }}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -120, 0],
            y: [-30, 30, -30],
          }}
          transition={{
            duration: duration * 2.5,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-60"
          style={{ 
            background: color2,
            filter: `blur(${blur}px)`,
          }}
        />
        <motion.div
          animate={{
            x: [-50, 50, -50],
            y: [-50, 50, -50],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: duration * 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[20%] left-[30%] w-[50%] h-[50%] rounded-full opacity-40"
          style={{ 
            background: color3,
            filter: `blur(${blur}px)`,
          }}
        />
        <motion.div
          animate={{
            x: [30, -30, 30],
            y: [30, -30, 30],
            rotate: [0, 45, 0],
          }}
          transition={{
            duration: duration * 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] rounded-full opacity-30"
          style={{ 
            background: color4,
            filter: `blur(${blur}px)`,
          }}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default DynamicBackground;
