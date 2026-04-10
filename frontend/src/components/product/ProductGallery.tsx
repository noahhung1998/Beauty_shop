'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import type { ProductImage } from '@/types';
import clsx from 'clsx';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return a.sortOrder - b.sortOrder;
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedImage = sortedImages[selectedIndex];

  if (sortedImages.length === 0) {
    return (
      <div className="aspect-square bg-gradient-to-br from-brand-soft-pink to-brand-blush rounded-2xl flex items-center justify-center">
        <Sparkles size={64} className="text-brand-rose-gold/30" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-cream group">
        <Image
          src={selectedImage.url}
          alt={selectedImage.alt || productName}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnail strip */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={clsx(
                'relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all',
                index === selectedIndex
                  ? 'border-brand-rose-gold ring-2 ring-brand-rose-gold/20'
                  : 'border-transparent hover:border-brand-cream-dark',
              )}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productName} ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
