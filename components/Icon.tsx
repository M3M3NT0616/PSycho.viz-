import React from 'react';

const Icon: React.FC = () => (
  <svg 
    width="32" 
    height="32" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className="text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]"
  >
    <path 
      d="M12 2L2 19H22L12 2Z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="animate-pulse"
    />
    <path 
      d="M12 6L17 15H7L12 6Z" 
      stroke="#22d3ee" 
      strokeWidth="1" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2" fill="#f472b6" className="animate-[ping_3s_ease-in-out_infinite]" />
    <path 
      d="M2 19L12 22L22 19" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      opacity="0.5"
    />
  </svg>
);

export default Icon;