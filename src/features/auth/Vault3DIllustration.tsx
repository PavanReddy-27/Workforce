import React from 'react';
import { Box, Typography } from '@mui/material';

export const Vault3DIllustration: React.FC = () => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: { xs: 360, md: '100%' },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(150deg, #e0f2fe 0%, #bae6fd 40%, #93c5fd 85%, #bfdbfe 100%)',
        p: { xs: 4, md: 6 },
      }}
    >
      {/* Ambient Light Streaks in Background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.45,
          background: `
            repeating-linear-gradient(
              180deg,
              transparent,
              transparent 40px,
              rgba(255, 255, 255, 0.6) 40px,
              rgba(255, 255, 255, 0.6) 70px,
              transparent 70px,
              transparent 140px
            )
          `,
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.1))',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.1))',
          backgroundSize: '180px 100%',
        }}
      />

      {/* Floating 3D Safe Vault Vector Asset */}
      <Box
        sx={{
          position: 'relative',
          width: { xs: 280, sm: 340, md: 380 },
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'vaultFloat 4.5s ease-in-out infinite',
          '@keyframes vaultFloat': {
            '0%, 100%': {
              transform: 'translateY(0px)',
            },
            '50%': {
              transform: 'translateY(-12px)',
            },
          },
        }}
      >
        <svg
          viewBox="0 0 500 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 25px 35px rgba(29, 78, 216, 0.22))' }}
        >
          <defs>
            {/* Ground shadow radial gradient */}
            <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#1e40af" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
            </radialGradient>

            {/* Front Door Face Gradient */}
            <linearGradient id="frontFaceGrad" x1="120" y1="130" x2="310" y2="400" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="65%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>

            {/* Inset Door Panel */}
            <linearGradient id="doorInsetGrad" x1="140" y1="160" x2="290" y2="370" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Top Isometric Face Gradient */}
            <linearGradient id="topFaceGrad" x1="120" y1="70" x2="400" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="50%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>

            {/* Right Isometric Face Gradient */}
            <linearGradient id="rightFaceGrad" x1="310" y1="160" x2="430" y2="360" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>

            {/* Cyan / Mint Combination Dial Gradients */}
            <radialGradient id="dialRingGrad" cx="45%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0891b2" />
            </radialGradient>

            <linearGradient id="dialInnerGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0e7490" />
              <stop offset="100%" stopColor="#155e75" />
            </linearGradient>

            {/* Chrome Spoke Wheel Gradients */}
            <linearGradient id="chromeLight" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#e2e8f0" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            <linearGradient id="chromeDark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Bevel highlight filter */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Ground Shadow */}
          <ellipse cx="250" cy="455" rx="160" ry="26" fill="url(#groundShadow)" />

          {/* 2. Top Face of Vault (Isometric Angled Up) */}
          <path
            d="M 120 152
               C 120 138, 130 128, 144 122
               L 236 84
               C 246 80, 258 80, 268 84
               L 396 138
               C 408 143, 414 153, 412 165
               L 294 212
               C 284 216, 272 216, 262 212
               Z"
            fill="url(#topFaceGrad)"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* 3. Right Side Face of Vault (Isometric Extrusion Right) */}
          <path
            d="M 294 212
               L 412 165
               C 418 167, 422 174, 422 182
               L 422 322
               C 422 334, 414 344, 402 349
               L 292 396
               C 284 399, 276 397, 276 388
               L 276 226
               C 276 218, 284 215, 294 212
               Z"
            fill="url(#rightFaceGrad)"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* 4. Front Face Outer Rounded Box (Deep Royal Blue) */}
          <path
            d="M 128 156
               C 114 162, 106 174, 106 190
               L 106 364
               C 106 382, 118 396, 136 399
               L 264 416
               C 278 418, 290 408, 292 394
               L 292 220
               C 292 208, 284 198, 272 194
               L 148 154
               C 142 152, 134 153, 128 156
               Z"
            fill="url(#frontFaceGrad)"
            stroke="rgba(191, 219, 254, 0.4)"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* 5. Inset Safe Door Bevel Frame (Recessed Front) */}
          <path
            d="M 134 182
               C 124 186, 118 196, 118 208
               L 118 352
               C 118 366, 128 376, 142 378
               L 248 392
               C 258 393, 268 386, 270 376
               L 270 232
               C 270 222, 264 214, 254 211
               L 148 180
               C 144 179, 138 180, 134 182
               Z"
            fill="url(#doorInsetGrad)"
            stroke="rgba(147, 197, 253, 0.25)"
            strokeWidth="2"
          />

          {/* 6. Door Left Hinge Accents */}
          <rect x="110" y="210" width="7" height="24" rx="3.5" fill="#93c5fd" opacity="0.8" />
          <rect x="110" y="320" width="7" height="24" rx="3.5" fill="#93c5fd" opacity="0.8" />

          {/* 7. Cyan / Mint Radial Combination Dial Lock (Center: ~194, 290) */}
          <g transform="translate(192, 286)">
            {/* Outer Cyan Ring */}
            <circle cx="0" cy="0" r="48" fill="url(#dialRingGrad)" />
            <circle cx="0" cy="0" r="48" stroke="#a5f3fc" strokeWidth="2.5" />

            {/* Notched Dial Teeth around the perimeter */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line
                key={deg}
                x1={Math.cos((deg * Math.PI) / 180) * 40}
                y1={Math.sin((deg * Math.PI) / 180) * 40}
                x2={Math.cos((deg * Math.PI) / 180) * 46}
                y2={Math.sin((deg * Math.PI) / 180) * 46}
                stroke="#164e63"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ))}

            {/* Inner Sunken Dial Plate */}
            <circle cx="0" cy="0" r="34" fill="url(#dialInnerGrad)" stroke="#67e8f9" strokeWidth="2" />
            <circle cx="0" cy="0" r="28" fill="#155e75" />

            {/* 8. Metallic Chrome Tri-Spoke Turn Wheel Handle */}
            {/* Spokes radiating at 30°, 150°, 270° */}
            {[30, 150, 270].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const xTarget = Math.cos(rad) * 44;
              const yTarget = Math.sin(rad) * 44;
              return (
                <g key={deg}>
                  <line
                    x1="0"
                    y1="0"
                    x2={xTarget}
                    y2={yTarget}
                    stroke="url(#chromeLight)"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  {/* Spoke Tip Cap Knob */}
                  <circle
                    cx={xTarget}
                    cy={yTarget}
                    r="6.5"
                    fill="url(#chromeLight)"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}

            {/* Central Chrome Wheel Hub */}
            <circle cx="0" cy="0" r="14" fill="url(#chromeLight)" stroke="#f8fafc" strokeWidth="2" />
            <circle cx="-3" cy="-3" r="4" fill="#ffffff" opacity="0.8" />
          </g>

          {/* 9. Top-Left Rim Specular Light Flare */}
          <path
            d="M 126 156 L 268 84"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>

        {/* Floating Glassmorphic Badges */}
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: { xs: -10, sm: -20 },
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.16)',
            borderRadius: '9999px',
            px: 2,
            py: 0.75,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            animation: 'badgeFloat1 5s ease-in-out infinite',
            '@keyframes badgeFloat1': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-6px)' },
            },
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
            }}
          />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a', letterSpacing: '-0.01em' }}>
            256-Bit JWT Encryption
          </Typography>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            bottom: 30,
            left: { xs: -10, sm: -24 },
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.16)',
            borderRadius: '9999px',
            px: 2,
            py: 0.75,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            animation: 'badgeFloat2 4s ease-in-out infinite',
            '@keyframes badgeFloat2': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(6px)' },
            },
          }}
        >
          <Typography sx={{ fontSize: '0.85rem' }}>🛡️</Typography>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a', letterSpacing: '-0.01em' }}>
            Zero-Trust RBAC Guard
          </Typography>
        </Box>
      </Box>

      {/* Modern Tagline below the Vault */}
      <Box sx={{ mt: 4, textAlign: 'center', zIndex: 1, maxWidth: 360 }}>
        <Typography
          sx={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#0f274a',
            letterSpacing: '-0.02em',
          }}
        >
          Stackly Security Architecture
        </Typography>
        <Typography
          sx={{
            fontSize: '0.82rem',
            color: '#33537a',
            mt: 0.5,
            lineHeight: 1.5,
          }}
        >
          Hardware-grade TOTP verification, SQLite session auditing, and role-enforced cryptographic boundaries for Stackly Workforce.
        </Typography>
      </Box>
    </Box>
  );
};
