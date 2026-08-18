import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'horizontal' | 'vertical' | 'icon' | 'full-banner';
  showSubtitle?: boolean;
  showTagline?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  showSubtitle = true,
  showTagline = false,
  theme = 'dark',
  className = ''
}) => {
  // Dimensions for icon and typography
  const emblemSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-36 h-36'
  };

  const textSizes = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
    '2xl': 'text-7xl'
  };

  const crownOverCSizes = {
    xs: 'w-2.5 h-2 -top-1.5 left-0.5',
    sm: 'w-3.5 h-2.5 -top-2 left-0.5',
    md: 'w-4.5 h-3.5 -top-3 left-1',
    lg: 'w-6 h-4.5 -top-4 left-1.5',
    xl: 'w-9 h-7 -top-6 left-2',
    '2xl': 'w-14 h-10 -top-9 left-3'
  };

  // SVG Emblem matching the uploaded 3D Crown + Tooth + Orbit + CAD Pixels
  const renderEmblem = () => (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${emblemSizes[size]}`}>
      <svg
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,180,216,0.25)]"
      >
        <defs>
          {/* Metallic Sapphire Crown Gradients */}
          <linearGradient id="crownMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="25%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#1e40af" />
            <stop offset="75%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          <linearGradient id="crownHighlight" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.1" />
          </linearGradient>

          {/* 3D Anatomic Tooth Gradients */}
          <radialGradient id="toothRadial" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#f8fafc" />
            <stop offset="75%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#93c5fd" />
          </radialGradient>

          <linearGradient id="toothShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#7dd3fc" />
          </linearGradient>

          {/* Glowing Electric Orbit Swoosh Gradient */}
          <linearGradient id="orbitSwoosh" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#00d2ff" stopOpacity="1" />
            <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.8" />
          </linearGradient>

          {/* Glowing Sphere Gradient for Crown Jewels */}
          <radialGradient id="jewelGlow" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#67e8f9" />
            <stop offset="80%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          {/* Filters */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="pixelGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- 1. Soft Ambient Ground Glow --- */}
        <ellipse cx="150" cy="275" rx="55" ry="10" fill="#00d2ff" fillOpacity="0.25" filter="url(#softGlow)" />

        {/* --- 2. 3D Dental Molar Tooth Anatomy --- */}
        <g id="dental-tooth">
          {/* Main Molar Crown and Dual Curved Roots */}
          <path
            d="M95 105
               C95 72, 120 70, 150 78
               C180 70, 205 72, 205 105
               C205 138, 212 170, 195 210
               C185 235, 175 258, 162 260
               C153 262, 149 235, 150 205
               C150 195, 148 195, 148 205
               C149 235, 145 262, 136 260
               C123 258, 113 235, 103 210
               C86 170, 95 138, 95 105 Z"
            fill="url(#toothRadial)"
            stroke="#bae6fd"
            strokeWidth="2.5"
          />

          {/* Tooth Gloss Specular Light Highlight (Left Upper Shoulder) */}
          <path
            d="M106 102
               C106 82, 122 80, 140 85
               C128 95, 116 115, 116 142
               C108 128, 106 114, 106 102 Z"
            fill="#ffffff"
            fillOpacity="0.85"
          />

          {/* Secondary Gloss on Right Cuspal Ridge */}
          <path
            d="M188 100
               C196 114, 194 135, 188 152
               C187 140, 189 122, 182 108
               C184 105, 186 102, 188 100 Z"
            fill="#ffffff"
            fillOpacity="0.5"
          />

          {/* Root Groove Depth Shadow */}
          <path
            d="M148 192 C148 220, 149 240, 150 252 C150.5 240, 151 220, 151 192 Z"
            fill="#7dd3fc"
            fillOpacity="0.6"
          />
        </g>

        {/* --- 3. Royal Metallic Sapphire Crown (Sitting on Top of Tooth) --- */}
        <g id="royal-crown" filter="url(#softGlow)">
          {/* Base of the Crown (Curved to Match Tooth Ridge) */}
          <path
            d="M98 88
               C112 94, 150 97, 188 94
               C198 92, 202 88, 202 88
               L208 55
               L182 68
               L150 26
               L118 68
               L92 55
               Z"
            fill="url(#crownMetallic)"
            stroke="#7dd3fc"
            strokeWidth="1.5"
          />

          {/* Inner Crown Shading / Chiseled Metallic Highlights */}
          <path
            d="M150 29
               L179 66
               L150 88
               L121 66
               Z"
            fill="url(#crownHighlight)"
          />

          <path
            d="M94 57
               L118 67
               L105 87
               Z"
            fill="#0369a1"
            fillOpacity="0.6"
          />

          <path
            d="M206 57
               L182 67
               L195 87
               Z"
            fill="#0369a1"
            fillOpacity="0.6"
          />

          {/* Crown Jewels / Spheres on the 5 Peaks */}
          {/* Outer Left */}
          <circle cx="92" cy="54" r="5" fill="url(#jewelGlow)" stroke="#ffffff" strokeWidth="1" />
          {/* Mid Left */}
          <circle cx="118" cy="68" r="4.5" fill="url(#jewelGlow)" stroke="#ffffff" strokeWidth="0.8" />
          {/* Center Tallest Jewel */}
          <circle cx="150" cy="24" r="7" fill="url(#jewelGlow)" stroke="#ffffff" strokeWidth="1.5" />
          {/* Mid Right */}
          <circle cx="182" cy="68" r="4.5" fill="url(#jewelGlow)" stroke="#ffffff" strokeWidth="0.8" />
          {/* Outer Right */}
          <circle cx="208" cy="54" r="5" fill="url(#jewelGlow)" stroke="#ffffff" strokeWidth="1" />
        </g>

        {/* --- 4. Dynamic Electric Orbit Swoosh Ring --- */}
        <g id="orbital-swoosh">
          {/* Back Orbit Segment (Passing Behind) */}
          <path
            d="M102 142
               C88 128, 98 108, 126 95
               C160 80, 202 82, 226 98"
            stroke="url(#orbitSwoosh)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />

          {/* Front Orbit Swoosh (Thick, Swooping Front Across Tooth) */}
          <path
            d="M82 172
               C68 152, 75 130, 102 118
               C138 102, 192 112, 228 142
               C246 156, 252 170, 238 180
               C224 190, 190 182, 150 168
               C115 156, 90 162, 82 172 Z"
            fill="url(#orbitSwoosh)"
            filter="url(#softGlow)"
          />

          {/* Inner Light Core Filament */}
          <path
            d="M88 165
               C112 145, 160 138, 218 158
               C235 164, 240 172, 232 176"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.9"
          />
        </g>

        {/* --- 5. Digital CAD Voxel / Pixel Stream Grid --- */}
        <g id="cad-pixels" fill="#00d2ff" filter="url(#pixelGlow)">
          {/* Upper Cluster */}
          <rect x="238" y="112" width="9" height="9" rx="1.5" fill="#00e5ff" opacity="0.95" />
          <rect x="251" y="102" width="8" height="8" rx="1.5" fill="#38bdf8" opacity="0.9" />
          <rect x="263" y="94" width="7" height="7" rx="1" fill="#7dd3fc" opacity="0.85" />
          <rect x="274" y="86" width="6" height="6" rx="1" fill="#bae6fd" opacity="0.75" />

          {/* Middle Row */}
          <rect x="246" y="125" width="8.5" height="8.5" rx="1.5" fill="#00d2ff" opacity="0.9" />
          <rect x="258" y="115" width="7.5" height="7.5" rx="1" fill="#38bdf8" opacity="0.8" />
          <rect x="269" y="106" width="6.5" height="6.5" rx="1" fill="#7dd3fc" opacity="0.7" />

          {/* Lower Trail */}
          <rect x="254" y="137" width="8" height="8" rx="1.5" fill="#0284c7" opacity="0.85" />
          <rect x="266" y="128" width="7" height="7" rx="1" fill="#00d2ff" opacity="0.75" />
          <rect x="277" y="120" width="5.5" height="5.5" rx="1" fill="#38bdf8" opacity="0.65" />
        </g>
      </svg>
    </div>
  );

  // If icon-only is requested
  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderEmblem()}</div>;
  }

  // Vertical (Stacked) Presentation
  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        {renderEmblem()}

        {/* CrownDesk Wordmark */}
        <div className="mt-2 relative">
          {/* Miniature Crown Over Letter 'C' */}
          <div className={`absolute ${crownOverCSizes[size]} text-blue-500`}>
            <svg viewBox="0 0 24 16" fill="currentColor" className="w-full h-full drop-shadow-sm">
              <path d="M2 14 L5 4 L9 9 L12 2 L15 9 L19 4 L22 14 Z" />
              <circle cx="5" cy="3" r="1.5" fill="#38bdf8" />
              <circle cx="12" cy="1.5" r="1.8" fill="#67e8f9" />
              <circle cx="19" cy="3" r="1.5" fill="#38bdf8" />
            </svg>
          </div>

          <div className="flex items-center justify-center leading-none tracking-tight">
            <span className={`font-black ${textSizes[size]} text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500`}>
              Crown
            </span>
            <span className={`font-black ${textSizes[size]} text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400`}>
              Desk
            </span>
          </div>
        </div>

        {/* Subtitle */}
        {showSubtitle && (
          <div className="mt-2.5 flex items-center justify-center gap-2 w-full max-w-[280px]">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyan-500/60 to-cyan-500/80" />
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-cyan-400 whitespace-nowrap">
              Dental CAD Case Management Platform
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-cyan-500/60 to-cyan-500/80" />
          </div>
        )}

        {/* Tagline */}
        {showTagline && (
          <p className="text-[11px] sm:text-xs italic text-slate-400 mt-1 font-light tracking-wide">
            Precision Dental CAD. Seamless Case Management.
          </p>
        )}
      </div>
    );
  }

  // Full-Banner Billboard Presentation (matches uploaded photo layout)
  if (variant === 'full-banner') {
    return (
      <div className={`flex flex-col items-center justify-center p-8 sm:p-12 bg-slate-950 border border-slate-800/80 rounded-3xl shadow-2xl relative overflow-hidden text-center select-none ${className}`}>
        {/* Deep ambient backdrop glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Center Emblem */}
        <div className="relative z-10 scale-110 sm:scale-125 mb-4">
          {renderEmblem()}
        </div>

        {/* Wordmark with Crown Over 'C' */}
        <div className="relative z-10 inline-block mt-2">
          {/* Miniature Royal Crown over 'C' */}
          <div className="absolute -top-4 sm:-top-5 left-1 sm:left-2 w-6 sm:w-8 h-4 sm:h-5 text-blue-500">
            <svg viewBox="0 0 24 16" fill="currentColor" className="w-full h-full drop-shadow">
              <path d="M2 14 L5 4 L9 9 L12 2 L15 9 L19 4 L22 14 Z" />
              <circle cx="5" cy="3" r="1.5" fill="#38bdf8" />
              <circle cx="12" cy="1.5" r="1.8" fill="#67e8f9" />
              <circle cx="19" cy="3" r="1.5" fill="#38bdf8" />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500">
              Crown
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Desk
            </span>
          </h1>
        </div>

        {/* Divider with Platform Title */}
        <div className="relative z-10 mt-4 flex items-center justify-center gap-3 w-full max-w-md">
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-cyan-500 to-cyan-400" />
          <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-[0.2em] text-cyan-400 whitespace-nowrap">
            Dental CAD Case Management Platform
          </span>
          <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-cyan-500 to-cyan-400" />
        </div>

        {/* Tagline */}
        <p className="relative z-10 text-xs sm:text-sm italic text-slate-300/80 mt-2.5 font-light tracking-wide">
          Precision Dental CAD. Seamless Case Management.
        </p>
      </div>
    );
  }

  // Standard Horizontal Layout (Default - For Navbar, Header, Modals, Footer)
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {renderEmblem()}

      {/* Brand Typography */}
      <div className="relative">
        {/* Miniature Crown Over 'C' */}
        <div className={`absolute ${crownOverCSizes[size]} text-blue-500`}>
          <svg viewBox="0 0 24 16" fill="currentColor" className="w-full h-full drop-shadow-sm">
            <path d="M2 14 L5 4 L9 9 L12 2 L15 9 L19 4 L22 14 Z" />
            <circle cx="5" cy="3" r="1.5" fill="#38bdf8" />
            <circle cx="12" cy="1.5" r="1.8" fill="#67e8f9" />
            <circle cx="19" cy="3" r="1.5" fill="#38bdf8" />
          </svg>
        </div>

        <div className="flex items-center leading-none tracking-tight">
          <span className={`font-black ${textSizes[size]} text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500`}>
            Crown
          </span>
          <span className={`font-black ${textSizes[size]} text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400`}>
            Desk
          </span>
        </div>

        {showSubtitle && size !== 'xs' && size !== 'sm' && (
          <div className="text-[9px] sm:text-[10px] tracking-wider uppercase font-bold text-cyan-400 mt-1 whitespace-nowrap">
            Dental CAD Case Platform
          </div>
        )}
      </div>
    </div>
  );
};

