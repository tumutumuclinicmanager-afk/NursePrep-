import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote, CheckCircle2, Award, Sparkles, GraduationCap } from 'lucide-react';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  schoolOrHospital: string;
  examPassed: string;
  scoreOrResult: string;
  avatar: string;
  rating: number;
  text: string;
  highlight: string;
  date: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Faith Wanjiru, KRCHN, RN',
    role: 'Critical Care Nurse',
    schoolOrHospital: 'Kenyatta National Hospital & Aga Khan University',
    examPassed: 'NCK Licensure & NCLEX-RN',
    scoreOrResult: 'Passed NCLEX in 85 Questions',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=200',
    rating: 5,
    text: 'Transitioning from Kenyan nursing training to the US NextGen NCLEX format felt daunting until I used Nurse Prep. The NGN case studies and pharmacology modules bridged every gap between NCK standards and US clinical practice. Passed in 85 questions on my very first try!',
    highlight: 'Bridged the NCK to NCLEX-RN gap perfectly',
    date: '2 weeks ago'
  },
  {
    id: '2',
    name: 'Aaliyah Washington, BSN, RN',
    role: 'Labor & Delivery Nurse',
    schoolOrHospital: 'Howard University Hospital & Emory Healthcare',
    examPassed: 'HESI A2 & NCLEX-RN',
    scoreOrResult: '95% HESI / Passed in 85 Questions',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    rating: 5,
    text: 'Balancing accelerated BSN clinical rotations with studying was overwhelming. The realistic mock exam timers and NextGen clinical judgment questions simulated test day so accurately that walking into Pearson VUE felt like second nature.',
    highlight: 'Zero test anxiety on exam day',
    date: '3 weeks ago'
  },
  {
    id: '3',
    name: 'David Okafor, APRN, FNP-C',
    role: 'Family Nurse Practitioner',
    schoolOrHospital: 'Ohio State Medical Center',
    examPassed: 'NCLEX-RN & ANCC FNP',
    scoreOrResult: '100% First-Time Pass Rate Mentee Cohort',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    rating: 5,
    text: 'I recommend Nurse Prep to all my nursing students and mentees. The quality of rationales, instant diagnostic analytics, and true-to-exam NextGen difficulty make it the single most reliable preparation platform available.',
    highlight: 'Highest recommendation for clinical licensure',
    date: '1 month ago'
  },
  {
    id: '4',
    name: 'Marcus Chen, RN',
    role: 'Emergency Dept Resident',
    schoolOrHospital: 'UT Austin School of Nursing',
    examPassed: 'NCLEX-RN (NextGen)',
    scoreOrResult: 'Passed First Attempt',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
    rating: 5,
    text: 'I struggled with pharmacology and fluid/electrolytes for months. The adaptive question generator drilled my weak spots until my retention hit 90%. The clinical rationales helped me understand patient prioritization rather than just memorizing facts.',
    highlight: 'Adaptive quizzes drilled my weakest topics',
    date: '1 month ago'
  },
  {
    id: '5',
    name: 'Emily Miller, BSN',
    role: 'Pediatric Oncology Nurse',
    schoolOrHospital: 'Johns Hopkins School of Nursing',
    examPassed: 'ATI TEAS 7 & NCLEX-RN',
    scoreOrResult: '94th Percentile TEAS / Passed NCLEX',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
    rating: 5,
    text: 'Getting into nursing school is hyper-competitive. The TEAS math and science practice banks broke down complex physiology and unit conversions step-by-step. Scored in the 94th percentile and got accepted into my dream program!',
    highlight: 'Scored in the 94th Percentile',
    date: '2 months ago'
  }
];

export default function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState(1);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const current = TESTIMONIALS[currentIndex];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.35 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 }
      }
    })
  };

  return (
    <section 
      className="py-20 px-6 bg-slate-900 text-white relative overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Ambience & Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs sm:text-sm font-semibold mb-4">
            <GraduationCap className="w-4 h-4" /> Real Student Success Stories
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Trusted by Future Nurses Worldwide
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Hear how our practice banks, adaptive mock tests, and rationales helped students pass on their first try.
          </p>
        </div>

        {/* Carousel Card Container */}
        <div className="relative min-h-[380px] sm:min-h-[320px] flex items-center justify-center">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={current.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full bg-slate-800/80 border border-slate-700/60 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative Watermark Quote */}
              <Quote className="absolute -top-2 right-6 w-24 h-24 text-slate-700/20 pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Profile Info */}
                <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left border-b lg:border-b-0 lg:border-r border-slate-700/60 pb-6 lg:pb-0 lg:pr-8">
                  <div className="relative mb-4">
                    <img
                      src={current.avatar}
                      alt={current.name}
                      className="w-20 h-20 rounded-2xl object-cover ring-2 ring-blue-500/40 shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-0.5">{current.name}</h3>
                  <p className="text-xs text-blue-400 font-semibold mb-1">{current.role}</p>
                  <p className="text-xs text-slate-400 mb-3">{current.schoolOrHospital}</p>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <Award className="w-3.5 h-3.5" /> {current.scoreOrResult}
                  </div>
                </div>

                {/* Right Testimonial Content */}
                <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                  {/* Rating Stars & Exam Tag */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(current.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                      <span className="text-xs font-semibold text-slate-300 ml-1.5">5.0 Verified Review</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-300 border border-slate-600/40">
                      {current.examPassed}
                    </span>
                  </div>

                  {/* Highlight Quote */}
                  <div className="text-blue-300 font-semibold text-base sm:text-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>"{current.highlight}"</span>
                  </div>

                  {/* Detailed Review */}
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    "{current.text}"
                  </p>

                  <div className="text-xs text-slate-400 pt-1">
                    Verified Purchase & Licensure Result • {current.date}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Navigation Controls & Indicators */}
        <div className="flex items-center justify-between mt-8">
          {/* Prev/Next Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              aria-label="Previous testimonial"
              className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next testimonial"
              className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2">
            {TESTIMONIALS.map((t, idx) => (
              <button
                key={t.id}
                onClick={() => goToSlide(idx)}
                aria-label={`Go to testimonial ${idx + 1}`}
                className={`transition-all duration-300 h-2.5 rounded-full cursor-pointer ${
                  idx === currentIndex 
                    ? 'w-8 bg-blue-500' 
                    : 'w-2.5 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Quick Counter */}
          <div className="text-xs text-slate-400 font-mono">
            {currentIndex + 1} / {TESTIMONIALS.length}
          </div>
        </div>
      </div>
    </section>
  );
}
