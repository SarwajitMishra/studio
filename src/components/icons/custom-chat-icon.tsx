// src/components/icons/custom-chat-icon.tsx
import type React from 'react';

interface CustomChatIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  // Add other props your SVG might need, or that you want to pass down
}

// TODO: Replace the content of this component with your custom SVG icon.
// Example of embedding an SVG:
//
// const CustomChatIcon = ({ size = 24, className, ...props }: CustomChatIconProps) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     width={size}
//     height={size}
//     viewBox="0 0 24 24"
//     fill="none" // Or "currentColor" or specific color
//     stroke="currentColor" // Or "none" or specific color
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//     className={className}
//     {...props}
//   >
//     {/* Paste your SVG <path>, <circle>, etc. elements here */}
//     {/* e.g., <path d="M12 2 L2 22 L22 22 Z" /> */}
//   </svg>
// );
//
// Make sure to adjust props (like fill, stroke, viewBox) as needed for your SVG.

const CustomChatIcon = ({ size = 24, className, ...props }: CustomChatIconProps) => {
  // This is a placeholder icon (a simple speech bubble). Replace this with your actual SVG code.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor" // Default fill, can be overridden by props or className
      className={className}
      {...props}
      data-comment="This is a placeholder icon. Replace with your SVG in src/components/icons/custom-chat-icon.tsx"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
};

export default CustomChatIcon;
