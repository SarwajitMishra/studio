// src/components/icons/custom-chat-icon.tsx
import type React from 'react';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';

interface CustomChatIconProps {
  size?: number | string;
  className?: string;
  // The src prop will be the path to your icon in the public folder
  // e.g., /images/icons/custom-chat-icon.png
  src?: string; 
  alt?: string;
}

const CustomChatIcon = ({ 
  size = 24, 
  className, 
  src = '/images/icons/placeholder-chat-icon.png', // Default placeholder if no src provided
  alt = 'Chat Icon',
  ...props 
}: CustomChatIconProps) => {
  // If you are using a PNG, ensure it's placed in the public folder.
  // For example, if your icon is at public/images/icons/custom-chat-icon.png,
  // the src prop should be "/images/icons/custom-chat-icon.png".

  // We use a simple img tag here for flexibility with external or dynamic SVGs if needed,
  // or a NextImage for optimized PNGs.
  // For a user-provided PNG, NextImage is better.

  const numericSize = typeof size === 'string' ? parseInt(size, 10) : size;

  return (
    <NextImage
      src={src}
      alt={alt}
      width={numericSize}
      height={numericSize}
      className={cn(className)}
      // Add a data-ai-hint if you want to use AI to find a similar stock image later
      // data-ai-hint="chat bubble" 
      {...props}
      unoptimized={src.startsWith('data:') || src.endsWith('.svg')} // Basic check for SVGs or data URIs
    />
  );
};

export default CustomChatIcon;
