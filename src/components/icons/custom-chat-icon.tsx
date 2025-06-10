
// src/components/icons/custom-chat-icon.tsx
import type React from 'react';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';

interface CustomChatIconProps {
  size?: number | string;
  className?: string;
  /**
   * The path to your icon in the `public` folder.
   * IMPORTANT: Place your `custom-chat-icon.png` (or other named PNG)
   * in the `public/images/icons/` directory.
   * Example: If your icon is at `public/images/icons/my-chat-avatar.png`,
   * then this prop should be `/images/icons/my-chat-avatar.png`.
   */
  src?: string;
  alt?: string;
}

const CustomChatIcon = ({
  size = 24,
  className,
  // Default src assumes you have placed `custom-chat-icon.png`
  // at `public/images/icons/custom-chat-icon.png`
  src = '/images/icons/custom-chat-icon.png',
  alt = 'Chat Icon',
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
      // Next.js optimizes PNGs by default.
      // The 'unoptimized' prop is generally for specific cases like external URLs or when you want to serve the image as-is.
      // For local PNGs in /public, default optimization is usually what you want.
      // unoptimized={src.startsWith('data:')} // Only unoptimize for data URIs if ever used.
      {...props}
    />
  );
};

export default CustomChatIcon;
