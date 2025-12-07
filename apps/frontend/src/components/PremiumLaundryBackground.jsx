"use client";

import { motion } from "motion/react";

export function PremiumLaundryBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#e0f7fa] via-white to-[#b2ebf2]" />

      {/* Secondary flowing gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#80deea]/30 via-transparent to-[#4dd0e1]/20" />

      {/* Animated flowing shapes */}
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#4dd0e1]/10 to-transparent blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute -bottom-1/4 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-gradient-to-tl from-[#26c6da]/8 to-transparent blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, -60, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-white/20 to-[#80deea]/10 blur-2xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Subtle bubble elements */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="bubbleGradient">
            <stop offset="0%" stopColor="#4dd0e1" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#4dd0e1" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#4dd0e1" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Scattered bubbles */}
        <circle
          cx="15%"
          cy="20%"
          r="80"
          fill="url(#bubbleGradient)"
          stroke="#26c6da"
          strokeWidth="1"
        />
        <circle
          cx="85%"
          cy="15%"
          r="60"
          fill="url(#bubbleGradient)"
          stroke="#26c6da"
          strokeWidth="1"
        />
        <circle
          cx="10%"
          cy="75%"
          r="100"
          fill="url(#bubbleGradient)"
          stroke="#26c6da"
          strokeWidth="1"
        />
        <circle
          cx="90%"
          cy="80%"
          r="70"
          fill="url(#bubbleGradient)"
          stroke="#26c6da"
          strokeWidth="1"
        />
        <circle
          cx="25%"
          cy="45%"
          r="40"
          fill="url(#bubbleGradient)"
          stroke="#26c6da"
          strokeWidth="0.5"
        />
        <circle
          cx="75%"
          cy="50%"
          r="50"
          fill="url(#bubbleGradient)"
          stroke="#26c6da"
          strokeWidth="0.5"
        />
        <circle
          cx="50%"
          cy="85%"
          r="45"
          fill="url(#bubbleGradient)"
          stroke="#26c6da"
          strokeWidth="0.5"
        />
        <circle
          cx="60%"
          cy="25%"
          r="35"
          fill="url(#bubbleGradient)"
          stroke="#26c6da"
          strokeWidth="0.5"
        />
      </svg>

      {/* Animated floating bubbles */}
      <AnimatedBubble delay={0} startX="20%" startY="10%" />
      <AnimatedBubble delay={2} startX="80%" startY="20%" />
      <AnimatedBubble delay={4} startX="30%" startY="70%" />
      <AnimatedBubble delay={6} startX="70%" startY="60%" />
      <AnimatedBubble delay={8} startX="50%" startY="80%" />

      {/* Water droplets - extremely subtle */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.02]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 200,150 Q 200,120 180,100 Q 200,80 220,100 Q 200,120 200,150 Z"
          fill="#26c6da"
          opacity="0.4"
        />
        <path
          d="M 1400,300 Q 1400,275 1385,260 Q 1400,245 1415,260 Q 1400,275 1400,300 Z"
          fill="#26c6da"
          opacity="0.4"
        />
        <path
          d="M 300,800 Q 300,770 280,750 Q 300,730 320,750 Q 300,770 300,800 Z"
          fill="#26c6da"
          opacity="0.4"
        />
        <path
          d="M 1600,700 Q 1600,680 1587,665 Q 1600,650 1613,665 Q 1600,680 1600,700 Z"
          fill="#26c6da"
          opacity="0.4"
        />
      </svg>

      {/* Fabric fold waves - barely visible curved lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.015]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 0,400 Q 300,380 600,400 T 1200,400 T 1800,400"
          stroke="#26c6da"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M 0,600 Q 350,620 700,600 T 1400,600 T 2000,600"
          stroke="#4dd0e1"
          strokeWidth="2"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M 200,200 Q 500,180 800,200 T 1400,200 T 2000,200"
          stroke="#80deea"
          strokeWidth="1.5"
          fill="none"
          opacity="0.3"
        />
      </svg>

      {/* Vignette effect to keep center clean */}
      <div
        className="absolute inset-0 bg-radial-gradient"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, transparent 40%, rgba(224, 247, 250, 0.3) 100%)",
        }}
      />
    </div>
  );
}

function AnimatedBubble({ delay, startX, startY }) {
  return (
    <motion.div
      className="absolute w-12 h-12 rounded-full border border-[#26c6da]/[0.02] bg-gradient-radial from-white/[0.02] to-transparent"
      style={{ left: startX, top: startY }}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, -15, 0],
        scale: [1, 1.1, 0.9, 1],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      }}
    />
  );
}
