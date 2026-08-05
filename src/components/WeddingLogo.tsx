/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface WeddingLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  themeColor?: 'blue' | 'gold' | 'white';
}

export default function WeddingLogo({
  className = '',
  size = 'md',
  themeColor = 'blue',
}: WeddingLogoProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  const colors = {
    blue: {
      primary: 'stroke-[#1A3A5C]',
      gold: 'stroke-[#C4A475]',
      v: 'fill-[#1A3A5C]',
      j: 'fill-[#C4A475]',
      text: 'fill-[#1A3A5C]',
    },
    gold: {
      primary: 'stroke-[#C4A475]',
      gold: 'stroke-[#DFD3C3]',
      v: 'fill-[#DFD3C3]',
      j: 'fill-[#C4A475]',
      text: 'fill-[#C4A475]',
    },
    white: {
      primary: 'stroke-white',
      gold: 'stroke-[#DFD3C3]',
      v: 'fill-white',
      j: 'fill-[#DFD3C3]',
      text: 'fill-white',
    },
  };

  const activeColor = colors[themeColor];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} id="wedding-logo">
      <svg
        viewBox="0 0 200 200"
        className={`${sizeClasses[size]} transition-all duration-300`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fine Ornamental Outer Dotted Ring */}
        <circle
          cx="100"
          cy="100"
          r="88"
          className={`${activeColor.gold} opacity-40`}
          strokeWidth="0.75"
          strokeDasharray="4 3"
        />

        {/* Solid Circular Frame */}
        <circle
          cx="100"
          cy="100"
          r="82"
          className={activeColor.primary}
          strokeWidth="1.25"
          strokeOpacity="0.9"
        />

        {/* Fine Inner Accent Ring */}
        <circle
          cx="100"
          cy="100"
          r="76"
          className={`${activeColor.gold} opacity-60`}
          strokeWidth="0.75"
        />

        {/* Decorative Delicate Fleurons / Dots around the inner circle */}
        <circle cx="100" cy="24" r="2" className={activeColor.gold} fill="currentColor" />
        <circle cx="100" cy="176" r="2" className={activeColor.gold} fill="currentColor" />
        <circle cx="24" cy="100" r="2" className={activeColor.gold} fill="currentColor" />
        <circle cx="176" cy="100" r="2" className={activeColor.gold} fill="currentColor" />

        {/* Monogram V & J (V is left/upper, J is right/lower, elegantly superposed) */}
        <g style={{ mixBlendMode: 'multiply' }}>
          {/* Letter V */}
          <text
            x="68"
            y="118"
            className={`${activeColor.v} font-serif`}
            fontSize="68"
            fontWeight="300"
            textAnchor="start"
            style={{ fontStyle: 'normal' }}
          >
            V
          </text>
          
          {/* Letter J */}
          <text
            x="102"
            y="136"
            className={`${activeColor.j} font-serif`}
            fontSize="68"
            fontWeight="300"
            textAnchor="start"
            style={{ fontStyle: 'normal' }}
          >
            J
          </text>
        </g>

        {/* Small classical star at the center-bottom */}
        <path
          d="M100 156 L102 161 L107 161 L103 164 L105 169 L100 166 L95 169 L97 164 L93 161 L98 161 Z"
          className={activeColor.gold}
          fill="currentColor"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}
