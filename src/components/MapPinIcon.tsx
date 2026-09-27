import type { SVGProps } from 'react';

// A classic teardrop map pin whose point sits at the bottom centre.
export function MapPinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 32" {...props}>
      <path
        d="M12 1C6 1 1.5 5.5 1.5 11.3 1.5 19 12 31 12 31s10.5-12 10.5-19.7C22.5 5.5 18 1 12 1z"
        fill="currentColor"
        stroke="white"
        strokeWidth="2"
      />
      <circle cx="12" cy="11.5" r="4" fill="white" />
    </svg>
  );
}
