import React from 'react';

export const BookIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-[4/3] select-none pointer-events-none">
      {/* Background glow behind graphics */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#00D26A]/20 via-[#00E676]/10 to-transparent blur-3xl rounded-full transform -translate-y-2" />

      <svg
        viewBox="0 0 520 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-2xl"
      >
        <defs>
          {/* Gold Foil Gradients */}
          <linearGradient id="goldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE259" />
            <stop offset="50%" stopColor="#FFA751" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>

          <linearGradient id="goldAccents" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F7D070" />
            <stop offset="50%" stopColor="#FFF1BD" />
            <stop offset="100%" stopColor="#CBB051" />
          </linearGradient>

          {/* Book 1 - EDUCATION (Rich Emerald / Gold Luxury) */}
          <linearGradient id="eduBookSpine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#15803D" />
            <stop offset="60%" stopColor="#0B5226" />
            <stop offset="100%" stopColor="#052E15" />
          </linearGradient>
          <linearGradient id="eduBookCover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#0D602E" />
          </linearGradient>

          {/* Book 2 - MEDICAL (Deep Sapphire Teal / Cyan Glow) */}
          <linearGradient id="medBookSpine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0D6971" />
            <stop offset="60%" stopColor="#08474D" />
            <stop offset="100%" stopColor="#04262A" />
          </linearGradient>
          <linearGradient id="medBookCover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F8893" />
            <stop offset="100%" stopColor="#0B565D" />
          </linearGradient>

          {/* Book 3 - IT (Sleek Dark Cyber Emerald / Tech Gold) */}
          <linearGradient id="itBookSpine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A2B" />
            <stop offset="60%" stopColor="#10251A" />
            <stop offset="100%" stopColor="#06120C" />
          </linearGradient>
          <linearGradient id="itBookCover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#254B37" />
            <stop offset="100%" stopColor="#122A1E" />
          </linearGradient>

          {/* Paper Pages Layering */}
          <linearGradient id="paperPages" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Spine Gloss Overlay */}
          <linearGradient id="spineGloss" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="15%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Soft Drop Shadows */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* --- FANCY STACKED BOOKS --- */}
        <g filter="url(#softShadow)">

          {/* ================= BOTTOM BOOK: IT ================= */}
          <g transform="translate(170, 200)">
            {/* Spine */}
            <path d="M 0,28 L 130,68 L 130,96 L 0,56 Z" fill="url(#itBookSpine)" />
            {/* Front Cover top surface */}
            <path d="M 0,28 L 130,68 L 240,28 L 110,-12 Z" fill="url(#itBookCover)" />
            {/* Pages edge */}
            <path d="M 130,68 L 240,28 L 240,54 L 130,96 Z" fill="url(#paperPages)" />
            {/* Page lines */}
            <path d="M 132,71 L 238,32" stroke="#CBD5E1" strokeWidth="1" />
            <path d="M 132,77 L 238,38" stroke="#CBD5E1" strokeWidth="1" />
            <path d="M 132,83 L 238,44" stroke="#CBD5E1" strokeWidth="1" />

            {/* Gold Metallic Band Accents */}
            <path d="M 15,32 L 25,35 L 25,63 L 15,60 Z" fill="url(#goldAccents)" opacity="0.85" />
            <path d="M 110,61 L 120,64 L 120,92 L 110,89 Z" fill="url(#goldAccents)" opacity="0.85" />

            {/* Book Title Spine Text - Matched to 3D Spine Perspective (Matrix Skew + Perspective Vector) */}
            <text
              x="22"
              y="52"
              fill="url(#goldFoil)"
              fontSize="16"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="3"
              transform="matrix(1, 0.3077, 0, 1, 0, 0)"
              className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            >
              IT
            </text>
          </g>

          {/* ================= MIDDLE BOOK: MEDICAL ================= */}
          <g transform="translate(160, 150)">
            {/* Spine */}
            <path d="M 0,28 L 130,68 L 130,96 L 0,56 Z" fill="url(#medBookSpine)" />
            {/* Front Cover top surface */}
            <path d="M 0,28 L 130,68 L 240,28 L 110,-12 Z" fill="url(#medBookCover)" />
            {/* Pages edge */}
            <path d="M 130,68 L 240,28 L 240,54 L 130,96 Z" fill="url(#paperPages)" />
            {/* Page lines */}
            <path d="M 132,71 L 238,32" stroke="#CBD5E1" strokeWidth="1" />
            <path d="M 132,77 L 238,38" stroke="#CBD5E1" strokeWidth="1" />
            <path d="M 132,83 L 238,44" stroke="#CBD5E1" strokeWidth="1" />

            {/* Gold Metallic Band Accents */}
            <path d="M 12,31 L 20,33 L 20,61 L 12,59 Z" fill="url(#goldAccents)" opacity="0.85" />

            {/* Spine Title Text - Matched to 3D Spine Perspective */}
            <text
              x="16"
              y="52"
              fill="url(#goldFoil)"
              fontSize="14"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="2.5"
              transform="matrix(1, 0.3077, 0, 1, 0, 0)"
              className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            >
              MEDICAL
            </text>
          </g>

          {/* ================= TOP BOOK: EDUCATION ================= */}
          <g transform="translate(150, 100)">
            {/* Satin Gold Bookmark Ribbon Hanging */}
            <path d="M 200,10 C 215,25 210,65 225,85 L 238,80 L 230,55 C 220,40 215,20 200,10 Z" fill="url(#goldFoil)" opacity="0.9" />

            {/* Spine */}
            <path d="M 0,28 L 130,68 L 130,96 L 0,56 Z" fill="url(#eduBookSpine)" />
            {/* Front Cover top surface */}
            <path d="M 0,28 L 130,68 L 240,28 L 110,-12 Z" fill="url(#eduBookCover)" />
            {/* Pages edge */}
            <path d="M 130,68 L 240,28 L 240,54 L 130,96 Z" fill="#FFFFFF" />
            {/* Spine Gloss Overlay */}
            <path d="M 0,28 L 130,68 L 130,96 L 0,56 Z" fill="url(#spineGloss)" />

            {/* Gold Metallic Bands */}
            <path d="M 10,31 L 18,33 L 18,61 L 10,59 Z" fill="url(#goldAccents)" />
            <path d="M 115,63 L 123,65 L 123,93 L 115,91 Z" fill="url(#goldAccents)" />

            {/* Spine Title Text - Matched to 3D Spine Perspective */}
            <text
              x="14"
              y="52"
              fill="url(#goldFoil)"
              fontSize="13"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="2"
              transform="matrix(1, 0.3077, 0, 1, 0, 0)"
              className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            >
              EDUCATION
            </text>
          </g>
        </g>

        {/* --- PAST EXAM PAPERS DOCUMENT (FRONT OVERLAY SHEET) --- */}
        <g filter="url(#softShadow)" transform="translate(80, 205) rotate(-13)">
          {/* Paper Base Sheet */}
          <rect
            x="0"
            y="0"
            width="185"
            height="135"
            rx="6"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="1.5"
          />

          {/* Green Top Border Accent Line */}
          <rect x="0" y="0" width="185" height="5" rx="2" fill="#00D26A" />

          {/* Header Title: PAST EXAM PAPERS */}
          <text
            x="92"
            y="26"
            textAnchor="middle"
            fill="#0F172A"
            fontSize="11"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
            letterSpacing="1.8"
          >
            PAST EXAM PAPERS
          </text>

          {/* Subtitle / Divider Line */}
          <line x1="20" y1="34" x2="165" y2="34" stroke="#00D26A" strokeWidth="2" strokeLinecap="round" />

          {/* Exam Paper Fill Lines */}
          <line x1="20" y1="48" x2="165" y2="48" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="5 3" />
          <line x1="20" y1="62" x2="165" y2="62" stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1="20" y1="76" x2="165" y2="76" stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1="20" y1="90" x2="165" y2="90" stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1="20" y1="104" x2="140" y2="104" stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1="20" y1="118" x2="110" y2="118" stroke="#CBD5E1" strokeWidth="1.5" />

          {/* Green Checked Stamp Badge */}
          <g transform="translate(142, 92)">
            <circle cx="12" cy="12" r="12" fill="#00D26A" />
            <path d="M 7,12 L 10,15 L 17,8" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>

        {/* --- LUXURY EXECUTIVE PEN --- */}
        <g transform="translate(95, 260) rotate(24)" filter="url(#softShadow)">
          {/* Pen Body */}
          <rect x="0" y="0" width="150" height="10" rx="5" fill="#0A2016" />
          {/* Gold Pen Clip & Cap */}
          <rect x="12" y="0" width="40" height="10" rx="2" fill="#05140D" />
          <rect x="20" y="-2" width="22" height="2" fill="url(#goldFoil)" />
          {/* Gold Metallic Rings */}
          <rect x="52" y="0" width="4" height="10" fill="url(#goldFoil)" />
          <rect x="120" y="0" width="3" height="10" fill="url(#goldFoil)" />
          {/* Pen Tip */}
          <polygon points="150,0 164,5 150,10" fill="#0A2016" />
          <polygon points="158,3.8 164,5 158,6.2" fill="url(#goldFoil)" />
        </g>
      </svg>
    </div>
  );
};
