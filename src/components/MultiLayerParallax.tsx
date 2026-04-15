import * as React from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';

interface ParallaxLayer {
  url: string;
  speed: number; // -1 to 1, where 0 is static, positive moves with scroll, negative moves against
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  width?: string;
  opacity?: number;
  zIndex?: number;
}

interface MultiLayerParallaxProps {
  layers: ParallaxLayer[];
  height?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  showOnMobile?: boolean;
}

interface ParallaxLayerProps {
  layer: ParallaxLayer;
  start: number;
  end: number;
  scrollY: MotionValue<number>;
  index: number;
}

const ParallaxLayerItem: React.FC<ParallaxLayerProps> = ({ layer, start, end, scrollY, index }) => {
  // Calculate movement based on speed
  const movement = layer.speed * 400; 
  
  const yValue = useTransform(scrollY, [start, end], [movement, -movement]);
  const y = useSpring(yValue, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      style={{ 
        y,
        position: 'absolute',
        top: layer.top || 'auto',
        left: layer.left || 'auto',
        right: layer.right || 'auto',
        bottom: layer.bottom || 'auto',
        width: layer.width || 'auto',
        opacity: layer.opacity ?? 1,
        zIndex: layer.zIndex ?? 1,
      }}
      className="pointer-events-none"
    >
      <img 
        src={layer.url} 
        alt={`Layer ${index}`} 
        className="w-full h-auto object-contain"
        referrerPolicy="no-referrer"
      />
    </motion.div>
  );
};

const MultiLayerParallax: React.FC<MultiLayerParallaxProps> = ({
  layers = [],
  height = '100vh',
  backgroundColor = '#f8f9fa',
  children,
  showOnMobile = false,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [elementTop, setElementTop] = React.useState(0);
  const [elementHeight, setElementHeight] = React.useState(0);
  const [windowHeight, setWindowHeight] = React.useState(0);

  const { scrollY } = useScroll();

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const updateValues = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        setElementTop(rect.top + scrollTop);
        setElementHeight(rect.height);
        setWindowHeight(window.innerHeight);
      }
    };

    checkMobile();
    updateValues();
    
    window.addEventListener('resize', () => {
      checkMobile();
      updateValues();
    });
    window.addEventListener('scroll', updateValues, { passive: true });

    return () => {
      window.removeEventListener('resize', updateValues);
      window.removeEventListener('scroll', updateValues);
    };
  }, []);

  // Calculate relative scroll progress for this section
  const start = elementTop - windowHeight;
  const end = elementTop + elementHeight;

  // Hooks must be called before early return
  const contentYValue = useTransform(scrollY, [start, end], [80, -80]);
  const contentY = useSpring(contentYValue, { stiffness: 100, damping: 30 });

  // If it's mobile and we shouldn't show the effect, render a simplified version
  if (isMobile && !showOnMobile) {
    return (
      <section 
        className="relative overflow-hidden flex items-center justify-center p-12"
        style={{ height: 'auto', minHeight: '400px', backgroundColor }}
      >
        <div className="relative z-10 w-full">
          {children}
        </div>
      </section>
    );
  }

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden w-full"
      style={{ height, backgroundColor }}
    >
      {/* Parallax Layers */}
      {layers.map((layer, index) => (
        <ParallaxLayerItem 
          key={index} 
          layer={layer} 
          start={start} 
          end={end} 
          scrollY={scrollY} 
          index={index} 
        />
      ))}

      {/* Content Layer */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <motion.div
          style={{
            y: contentY
          }}
          className="container mx-auto px-6"
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
};

export default MultiLayerParallax;
