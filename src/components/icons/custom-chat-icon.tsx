
// src/components/icons/custom-chat-icon.tsx
import type React from 'react';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';

interface CustomChatIconProps {
  size?: number | string;
  className?: string;
  /**
   * The path to your icon in the `public` folder or a remote URL.
   * IMPORTANT: Place your `custom-chat-icon.png` in the `public/images/` directory
   * for local usage.
   * Example: If your icon is at `public/images/my-chat-avatar.png`,
   * then this prop should be `/icons/my-chat-avatar.png`.
   */
  src?: string;
  alt?: string;
  ['data-ai-hint']?: string; // Added to allow data-ai-hint
}

const CustomChatIcon = ({
  size = 24,
  className,
  // Default src uses a placeholder.
  // For a local icon, ensure `public/images/custom-chat-icon.png` exists.
  src = 'https://placehold.co/64x64.png',
  alt = 'Chat Icon',
  'data-ai-hint': dataAiHint = 'chatbot avatar', // Default hint
  ...props
}: CustomChatIconProps) => {
  const numericSize = typeof size === 'string' ? parseInt(size, 10) : size;

  return (
    <NextImage
      src={src}
      alt={alt}
      width={numericSize}
      height={numericSize}
      className={cn(className)}
      data-ai-hint={dataAiHint}
      // For local PNGs in /public, default optimization is usually what you want.
      {...props}
    />
  );
};

export default CustomChatIcon;
