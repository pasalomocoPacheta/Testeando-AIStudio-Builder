/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'motion/react';
import { builder } from '@builder.io/sdk';
import { BuilderComponent } from '@builder.io/react';
import { ArrowRight, ChevronRight, Globe, Users, Zap, ShieldCheck, BarChart3, MessageSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Initialize Builder with the provided API Key
builder.init('f450ca45929045f782ca4fdfb394abb9');

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BELUGA_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 616 635"><path fill="#FFD100" d="M 596.00 624.50 L 528.00 624.50 L 519.00 620.50 L 510.50 611.00 L 306.00 172.50 L 303.50 175.00 L 102.50 609.00 L 93.00 620.50 L 84.00 624.50 L 19.00 624.50 L 14.00 622.50 L 10.50 618.00 L 10.50 608.00 L 17.50 590.00 L 271.50 55.00 L 288.50 22.00 L 300.00 10.50 L 311.00 9.50 L 315.00 11.50 L 324.50 22.00 L 333.50 38.00 L 348.50 72.00 L 601.50 598.00 L 605.50 610.00 L 605.50 617.00 L 601.00 622.50 L 596.00 624.50 Z"/><path fill="#FFD100" d="M 308.00 537.50 L 303.00 536.50 L 297.50 531.00 L 249.50 453.00 L 243.50 442.00 L 243.50 435.00 L 245.00 433.50 L 367.00 432.50 L 369.50 434.00 L 370.50 441.00 L 366.50 449.00 L 320.50 524.00 L 314.50 533.00 L 308.00 537.50 Z"/></svg>`;

const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [rotation, setRotation] = useState(0);
  const prevMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      const dx = e.clientX - prevMousePos.current.x;
      const dy = e.clientY - prevMousePos.current.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        setRotation(angle + 90);
      }
      
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, [role="button"]')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-12 h-12 pointer-events-none z-[10000] flex items-center justify-center"
      animate={{
        x: mousePos.x - 24,
        y: mousePos.y - 24,
        scale: isHovering ? 1.5 : 1,
        rotate: rotation,
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 250, mass: 0.5 }}
    >
      <div 
        className={cn(
          "w-full h-full transition-all duration-300",
          isHovering ? "drop-shadow-[0_0_15px_rgba(255,209,0,0.8)]" : "drop-shadow-md"
        )}
        dangerouslySetInnerHTML={{ __html: BELUGA_LOGO_SVG }}
      />
      <motion.div 
        className="absolute w-2 h-2 bg-beluga-accent rounded-full -z-10"
        animate={{
          scale: [1, 2, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
};

const Section = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => (
  <section id={id} className={cn("min-h-screen relative overflow-hidden", className)}>
    {children}
  </section>
);

const BelugaWayCard = ({ title, content, icon: Icon, color }: { title: string, content: string, icon: any, color: string }) => (
  <motion.div
    whileHover={{ y: -10, scale: 1.02 }}
    className="bg-beluga-surface p-8 rounded-2xl border-b-4 border-transparent hover:border-beluga-accent transition-all duration-300 group shadow-xl"
  >
    <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-white", color)}>
      <Icon size={28} />
    </div>
    <h3 className="text-beluga-primary text-2xl mb-4 group-hover:text-beluga-info transition-colors">{title}</h3>
    <p className="text-beluga-primary/70 leading-relaxed">{content}</p>
  </motion.div>
);

export default function App() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  
  const [builderContent, setBuilderContent] = useState<any>(null);

  useEffect(() => {
    builder.get('page', { url: window.location.pathname }).then(setBuilderContent);
  }, []);

  return (
    <div className="relative">
      <CustomCursor />
      <div className="grain-overlay" />
      <div className="liquid-bg" />
      
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-beluga-accent z-[10001] origin-left"
        style={{ scaleX }}
      />

      {/* Floating Gradient Orbs */}
      <div className="gradient-orb w-[500px] h-[500px] bg-beluga-indigo top-[-10%] left-[-10%] animate-float" />
      <div className="gradient-orb w-[400px] h-[400px] bg-beluga-magenta bottom-[10%] right-[-5%] animate-float" style={{ animationDelay: '2s' }} />
      <div className="gradient-orb w-[300px] h-[300px] bg-beluga-violet top-[40%] right-[10%] animate-float" style={{ animationDelay: '4s' }} />

      {/* Hero Section */}
      <Section className="flex flex-col items-center justify-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-5xl"
        >
          <div className="w-24 h-24 mx-auto mb-12" dangerouslySetInnerHTML={{ __html: BELUGA_LOGO_SVG }} />
          <h1 className="text-6xl md:text-8xl lg:text-9xl mb-8 leading-tight">
            LANGUAGE SERVICES? <br />
            <span className="text-beluga-accent italic">NAH, WE SPEAK HUMAN</span>
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-12 text-beluga-muted/80 leading-relaxed">
            Languages, translation, word count, strings… OK, but what about the people behind each and every task in a language services company? Yep, they make a pretty big difference. And that’s why at Beluga we’re all about the people.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-beluga-primary text-xl px-12 py-6 flex items-center gap-3 mx-auto group"
          >
            ENTER THE POD
            <ArrowRight className="group-hover:translate-x-2 transition-transform" />
          </motion.button>
        </motion.div>
      </Section>

      {/* Human Touch Section */}
      <Section className="flex items-center justify-center bg-beluga-primary/50 backdrop-blur-sm">
        <div className="max-w-4xl px-6 text-center">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-4xl md:text-6xl mb-12"
          >
            At every step in the process, the <span className="relative inline-block">
              <span className="text-beluga-accent">human touch</span>
              <motion.svg 
                className="absolute -bottom-2 left-0 w-full" 
                viewBox="0 0 100 10" 
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 1 }}
              >
                <path d="M0,5 Q50,0 100,5" stroke="var(--beluga-color-accent)" strokeWidth="2" fill="none" />
              </motion.svg>
            </span> is key to making us a dream to work with – when everything goes like clockwork, you get to convey meaningful messages.
          </motion.h2>
        </div>
      </Section>

      {/* The Beluga Way Section */}
      <Section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-7xl mb-16 text-center">THE BELUGA WAY</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <BelugaWayCard 
              title="ONBOARDING"
              content="A deep dive into your business is the best way to truly understand your goals. We go the extra mile to make this happen."
              icon={Globe}
              color="bg-beluga-indigo"
            />
            <BelugaWayCard 
              title="TEAM BUILDING"
              content="We train our team members to become an integral cog in your spaceship, as though they’re part of your own team."
              icon={Users}
              color="bg-beluga-violet"
            />
            <BelugaWayCard 
              title="TAILOR-MADE SOLUTIONS"
              content="Each and every company has its own struggles. That’s why we craft a tailor-made, on-budget battle plan, from scheduling to last-minute content updates."
              icon={Zap}
              color="bg-beluga-magenta"
            />
            <BelugaWayCard 
              title="CHECK TO CHECK"
              content="Forget about black boxes and shady processes. There are people by your side to accompany you in every step of the process with understandable reports and an answer to every question you may have."
              icon={BarChart3}
              color="bg-beluga-blue"
            />
            <BelugaWayCard 
              title="QUALITY CONTROL"
              content="We deliver ongoing quality reviews and reports to make sure we’re on the same page. Transparency and high quality guaranteed."
              icon={ShieldCheck}
              color="bg-beluga-coral"
            />
            <BelugaWayCard 
              title="SUPPORT"
              content="Got projects in the pipeline and fancy a chat to see what magic we can conjure up? Send us some love and let’s get it on."
              icon={MessageSquare}
              color="bg-beluga-pink"
            />
          </div>
        </div>
      </Section>

      {/* Horizontal Scroll Gallery */}
      <Section className="h-[200vh] relative" id="horizontal-scroll">
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <motion.div 
            style={{ x: useTransform(scrollYProgress, [0.5, 0.8], ["0%", "-60%"]) }}
            className="flex gap-12 px-24"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div 
                key={i}
                className="min-w-[600px] h-[400px] bg-beluga-surface/10 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col justify-end p-12 group cursor-pointer overflow-hidden relative"
              >
                <img 
                  src={`https://picsum.photos/seed/beluga-${i}/800/600`} 
                  alt="Project" 
                  className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="relative z-10">
                  <span className="text-beluga-accent text-sm font-bold tracking-widest uppercase mb-4 block">INSIGHTS</span>
                  <h3 className="text-4xl mb-6">HUMAN-POWERED SUCCESS #{i}</h3>
                  <div className="w-12 h-12 rounded-full border border-white flex items-center justify-center group-hover:bg-beluga-accent group-hover:border-beluga-accent transition-all">
                    <ChevronRight className="group-hover:text-beluga-primary" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="flex flex-col items-center justify-center text-center px-6 bg-beluga-accent text-beluga-primary">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          className="max-w-4xl"
        >
          <h2 className="text-6xl md:text-8xl mb-12">IF YOU KNOW WHAT WE MEAN…</h2>
          <p className="text-2xl mb-12 font-medium">
            Got projects in the pipeline and fancy a chat to see what magic we can conjure up? Send us some love and let’s get it on.
          </p>
          <button className="btn-beluga-primary bg-beluga-primary text-beluga-secondary text-2xl px-16 py-8 hover:bg-beluga-indigo hover:border-beluga-indigo">
            LET’S MAKE WAVES
          </button>
        </motion.div>
      </Section>

      {/* For Curious Minds Section */}
      <Section className="py-24 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1">
            <h2 className="text-5xl md:text-7xl mb-8">FOR CURIOUS MINDS ONLY</h2>
            <p className="text-2xl text-beluga-muted/70 leading-relaxed">
              Our deepest thoughts about the market, interesting language-related stories, and a glimpse of what’s to come in the near and not-so-near future.
            </p>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="aspect-[3/4] bg-beluga-indigo rounded-3xl rotate-[-5deg] overflow-hidden">
               <img src="https://picsum.photos/seed/mind1/400/600" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
            </div>
            <div className="aspect-[3/4] bg-beluga-magenta rounded-3xl rotate-[5deg] translate-y-12 overflow-hidden">
               <img src="https://picsum.photos/seed/mind2/400/600" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </Section>

      {/* Final Section */}
      <Section className="flex flex-col items-center justify-center text-center px-6">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="max-w-4xl"
        >
          <h2 className="text-5xl md:text-7xl mb-12">CAN’T GET ENOUGH OF YOUR LOVE, BABE</h2>
          <p className="text-xl text-beluga-muted/60 mb-16">
            Eager to hear more about our revolution? Dive in with Beluga to join our pod of people believers.
          </p>
          <motion.div 
            className="w-32 h-32 mx-auto"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            dangerouslySetInnerHTML={{ __html: BELUGA_LOGO_SVG }}
          />
        </motion.div>
      </Section>

      {/* Builder.io Content Integration */}
      {builderContent && (
        <div className="builder-content-wrapper">
          <BuilderComponent model="page" content={builderContent} />
        </div>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center text-beluga-muted/40 text-sm">
        <p>© {new Date().getFullYear()} Beluga Linguistics. All rights reserved. Built with human love.</p>
      </footer>
    </div>
  );
}
