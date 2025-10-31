// Microsoft Azure logo as SVG component
export function AzureLogo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 96 96" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="azureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#114A8B', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#0078D4', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path 
        fill="url(#azureGradient)" 
        d="M50.75 4.5l-43.5 82.27h21.03L58.5 91.5l38.25-13.5-15-45L50.75 4.5zm7.5 54.75l-15.75 18-24.75-6 15.75-24 24.75 12z"
      />
    </svg>
  );
}
