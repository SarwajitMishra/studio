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
   * then this prop should be `/images/my-chat-avatar.png`.
   */
  src?: string;
  alt?: string;
  ['data-ai-hint']?: string;
}

const CustomChatIcon = ({
  size = 24,
  className,
  // Default src now points to a local path.
  // Ensure `public/images/custom-chat-icon.png` exists.
  src = '/images/custom-chat-icon.png',
  alt = 'Chat Icon',
  'data-ai-hint': dataAiHint = 'chatbot avatar',
  ...props
}: CustomChatIconProps) => {
  const numericSize = typeof size === 'string' ? parseInt(size, 10) : size;

  return (
    <NextImage
      src={src}
      alt={alt}
      width={numericSize}
      height={numericSize}
      className={cn("rounded-full", className)}
      data-ai-hint={dataAiHint}
      {...props}
    />
  );
};

export default CustomChatIcon;
