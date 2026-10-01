import React, { useState } from 'react';
import { Newspaper } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  categoryName?: string;
  fallbackText?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'बातमी छायाचित्र',
  categoryName,
  fallbackText,
  className = '',
  ...props
}) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        className={`bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300 text-stone-700 flex flex-col items-center justify-center p-4 relative overflow-hidden border border-stone-200 ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:16px_16px]" />
        <Newspaper className="w-8 h-8 text-stone-500 mb-2" />
        <span className="text-xs font-semibold tracking-wider text-stone-600 uppercase font-sans">
          {categoryName || 'बहुमोल समाज'}
        </span>
        <span className="text-xs text-stone-500 text-center line-clamp-1 mt-1 max-w-[80%] font-serif">
          {fallbackText || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className={className}
      loading="lazy"
      {...props}
    />
  );
};
