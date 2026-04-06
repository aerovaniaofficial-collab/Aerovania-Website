import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import imgGeospatialAi from "../imports/Frame1/aa68825eb23ffab903033faec204ec219781c127.png";
import imgEmbeddedIntelligence from "../imports/Frame1/a0ab787a70c673cd7a10ff797f03cedad74d2357.png";
import imgArtificialIntelligence from "../imports/Frame1/799b0c763938d4e819b681bc1423e056eea526e4.png";
import imgCompositeMaterials from "../imports/Frame1/a6227c6f93f6a76851b6d1a536109cca4d8e18a5.png";

const slides = [
  {
    id: 1,
    tag: "India's First Engineering Intelligence Company",
    title: "Geospatial Mapping",
    subtitle: "Precision Data Capture & Intelligence",
    description: "Advanced drone surveys, LiDAR mapping, and photogrammetry delivering survey grade geospatial intelligence for infrastructure planning and monitoring",
    features: ["±5mm Survey Precision", "High-Density Point Clouds", "Real-time Data Processing"],
    backgroundImage: imgGeospatialAi
  },
  {
    id: 2,
    tag: "AI Mines Analytics",
    title: "Turning Vision into Verified Reality",
    subtitle: "Precision Data Capture & Intelligence",
    description: "AI-powered aerial intelligence for defence, infrastructure, and environmental monitoring — from drone to decision in real time.",
    features: ["±5mm Survey Precision", "High-Density Point Clouds", "Real-time Data Processing"],
    backgroundImage: imgGeospatialAi
  },
  {
    id: 3,
    tag: "IWLARS Platform",
    title: "Intelligent Wagon Load Analysis & Reporting System",
    subtitle: "Precision Data Capture & Intelligence",
    description: "Persistent, AI-enhanced surveillance across borders, coastlines, and critical infrastructure — day and night, all weather.",
    features: ["±5mm Survey Precision", "High-Density Point Clouds", "Real-time Data Processing"],
    backgroundImage: imgGeospatialAi
  }
];

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setDirection(1);
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setDirection(-1);
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDotClick = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const slide = slides[currentSlide];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0
    })
  };

  return (
    <div className="relative size-full bg-[#444] overflow-hidden">
      {/* Background Image with Animation */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={`bg-${currentSlide}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.3, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              alt=""
              className="absolute h-[236.44%] left-0 max-w-none top-[-68.22%] w-full object-cover"
              src={slide.backgroundImage}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Gradient Overlay */}
      <div className="absolute bg-gradient-to-r from-[#4c4c4c] inset-0 to-[rgba(0,0,0,0)] via-1/2 via-[rgba(77,77,77,0.23)]" />

      {/* Content Container */}
      <div className="relative h-full flex flex-col justify-center px-[152px] py-[80px]">
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.4 }
            }}
          >
            {/* Tag */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-[#dbeafe] border border-[#bedbff] border-solid rounded-[26843500px] px-[24px] py-[11px] inline-flex w-fit mb-8"
            >
              <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#1447e6] text-[13.1px] leading-[20px]">
                {slide.tag}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-['Inter:Bold',sans-serif] font-bold text-white text-[60px] leading-[60px] mb-6 max-w-[540px]"
            >
              {slide.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#155dfc] text-[29.2px] leading-[36px] mb-6"
            >
              {slide.subtitle}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="font-['Inter:Regular',sans-serif] font-normal text-white text-[18.8px] leading-[32.5px] mb-8 max-w-[560px]"
            >
              {slide.description}
            </motion.p>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex gap-4 mb-12"
            >
              {slide.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="bg-white border border-[#bedbff] border-solid rounded-[10px] px-[16px] py-[11px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
                >
                  <span className="font-['Inter:Medium',sans-serif] font-medium text-[#1447e6] text-[13.3px] leading-[20px]">
                    {feature}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white border border-[#d1d5dc] border-solid rounded-[10px] px-[16px] py-[12px] w-fit"
            >
              <span className="font-['Inter:Medium',sans-serif] font-medium text-[#364153] text-[13.5px] leading-[20px]">
                Request Demo
              </span>
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Dots */}
      <div className="absolute left-[60px] top-1/2 -translate-y-1/2 flex flex-col gap-2">
        {slides.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => handleDotClick(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            animate={{
              height: currentSlide === index ? 48 : 12,
              backgroundColor: currentSlide === index ? '#155dfc' : '#d1d5dc'
            }}
            transition={{ duration: 0.3 }}
            className="rounded-full w-3"
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <motion.div
        key={`counter-${currentSlide}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-8 right-[60px] text-white/60 font-['Inter:Medium',sans-serif] text-sm"
      >
        {currentSlide + 1} / {slides.length}
      </motion.div>
    </div>
  );
}