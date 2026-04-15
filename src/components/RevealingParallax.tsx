import * as React from 'react';
import { motion, useScroll, useTransform, useSpring, transform } from 'framer-motion';

interface RevealingParallaxProps {
  image: string;
  steps: {
    title: string;
    content: string;
    buttonText?: string;
    buttonLink?: string;
  }[];
  imagePosition?: 'left' | 'right';
  backgroundColor?: string;
  textColor?: string;
  imageAlt?: string;
  imageRotation?: number;
  revealDirection?: 'bottom-to-top' | 'top-to-bottom' | 'left-to-right' | 'right-to-left';
}

const RevealingParallax: React.FC<RevealingParallaxProps> = ({
  image = 'https://belugalinguistics.com/hubfs/source/assets/images/illustrations/mentoring/mentoring-program-mobile-5.jpg',
  steps = [
    { 
      title: 'Mentoring Program', 
      content: '<p>Our mentoring program is designed to help you grow professionally and personally. We provide the tools and guidance you need to succeed.</p>',
      buttonText: 'Learn More',
      buttonLink: '#'
    },
    { 
      title: 'Personalized Guidance', 
      content: '<p>Get one-on-one support from experienced professionals who have been in your shoes. We tailor our approach to your specific goals.</p>' 
    },
    { 
      title: 'Career Growth', 
      content: '<p>Unlock new opportunities and accelerate your career path with our proven strategies and network.</p>' 
    },
  ],
  imagePosition = 'left',
  backgroundColor = '#ffffff',
  textColor = '#000000',
  imageAlt = 'Mentoring Illustration',
  imageRotation = 0,
  revealDirection = 'bottom-to-top',
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = React.useState(true);

  // Handle responsive breakpoints
  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 992);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Track scroll progress for the entire section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smooth progress for the reveal effect
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Use a function callback for useTransform to ensure it reacts to revealDirection changes
  const clipPath = useTransform(smoothProgress, (value) => {
    const progress = transform(value, [0, 0.8], [100, 0], { clamp: true });
    switch (revealDirection) {
      case 'top-to-bottom': return `inset(0% 0% ${progress}% 0%)`;
      case 'left-to-right': return `inset(0% ${progress}% 0% 0%)`;
      case 'right-to-left': return `inset(0% 0% 0% ${progress}%)`;
      case 'bottom-to-top':
      default: return `inset(${progress}% 0% 0% 0%)`;
    }
  });

  // Subtle zoom effect as it reveals
  const imageScale = useTransform(smoothProgress, [0, 1], [1.1, 1]);

  const isImageLeft = imagePosition === 'left';

  // Mobile Reveal Animation
  const getMobileInitialClip = () => {
    switch (revealDirection) {
      case 'top-to-bottom': return 'inset(0% 0% 100% 0%)';
      case 'left-to-right': return 'inset(0% 100% 0% 0%)';
      case 'right-to-left': return 'inset(0% 0% 0% 100%)';
      case 'bottom-to-top':
      default: return 'inset(100% 0% 0% 0%)';
    }
  };

  // Desktop Layout (Sticky Reveal)
  if (isDesktop) {
    return (
      <div 
        ref={containerRef} 
        className="relative w-full" 
        style={{ backgroundColor, color: textColor }}
      >
        {/* Sticky Container for the Image */}
        <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
          <div className="container mx-auto px-6 h-full flex flex-row items-center gap-24">
            
            {/* Image Side (Sticky) */}
            <div className={`w-1/2 h-[80vh] relative ${isImageLeft ? 'order-1' : 'order-2'}`}>
              <div className="absolute inset-0 bg-gray-50 rounded-[40px] opacity-50 shadow-inner" />
              
              <motion.div 
                style={{ clipPath }}
                className="absolute inset-0 w-full h-full flex items-center justify-center p-8"
              >
                <motion.img 
                  src={image} 
                  alt={imageAlt}
                  style={{ scale: imageScale, rotate: imageRotation }}
                  className="w-full h-full object-contain drop-shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </div>

            {/* Spacer for layout */}
            <div className={`w-1/2 ${isImageLeft ? 'order-2' : 'order-1'}`} />
          </div>
        </div>

        {/* Scrolling Text Content */}
        <div className="relative z-20 -mt-[100vh]">
          {steps.map((step, index) => (
            <section 
              key={index} 
              className="h-screen flex items-center"
            >
              <div className="container mx-auto px-6 flex flex-row items-center gap-24">
                {/* Spacer for Sticky Image */}
                <div className={`w-1/2 ${isImageLeft ? 'order-1' : 'order-2'}`} />
                
                {/* Actual Text Content */}
                <motion.div 
                  initial={{ opacity: 0, x: isImageLeft ? 50 : -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  viewport={{ margin: "-20% 0px -20% 0px" }}
                  className={`w-1/2 ${isImageLeft ? 'order-2' : 'order-1'} space-y-8`}
                >
                  <h3 className="text-7xl font-black tracking-tighter leading-[0.9] uppercase">
                    {step.title}
                  </h3>
                  <div 
                    className="prose prose-2xl max-w-none font-medium opacity-70 leading-relaxed"
                    style={{ color: textColor }}
                    dangerouslySetInnerHTML={{ __html: step.content }}
                  />
                  {step.buttonText && (
                    <motion.a
                      href={step.buttonLink || '#'}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-block px-10 py-5 bg-black text-white rounded-full font-bold text-xl uppercase tracking-widest shadow-xl"
                      style={{ backgroundColor: textColor === '#000000' ? '#000000' : textColor, color: backgroundColor }}
                    >
                      {step.buttonText}
                    </motion.a>
                  )}
                </motion.div>
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  // Mobile & Tablet Layout (Stacked / Flow)
  return (
    <div 
      className="relative w-full py-20" 
      style={{ backgroundColor, color: textColor }}
    >
      <div className="container mx-auto px-6 space-y-24">
        {/* Fixed Image for Mobile/Tablet context */}
        <div className="w-full h-[40vh] md:h-[50vh] relative mb-12">
          <div className="absolute inset-0 bg-gray-50 rounded-[30px] opacity-50 shadow-inner" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, clipPath: getMobileInitialClip() }}
            whileInView={{ opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full flex items-center justify-center p-6"
          >
            <motion.img 
              src={image} 
              alt={imageAlt}
              style={{ rotate: imageRotation }}
              className="w-full h-full object-contain drop-shadow-xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>

        {/* Steps as cards or sections */}
        <div className="space-y-16">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-10%" }}
              className="space-y-4 border-l-4 border-current pl-6 py-2"
            >
              <h3 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
                {step.title}
              </h3>
              <div 
                className="prose prose-lg md:prose-xl max-w-none font-medium opacity-70"
                style={{ color: textColor }}
                dangerouslySetInnerHTML={{ __html: step.content }}
              />
              {step.buttonText && (
                <a
                  href={step.buttonLink || '#'}
                  className="inline-block px-6 py-3 bg-black text-white rounded-full font-bold text-sm uppercase tracking-widest mt-4"
                  style={{ backgroundColor: textColor === '#000000' ? '#000000' : textColor, color: backgroundColor }}
                >
                  {step.buttonText}
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RevealingParallax;
