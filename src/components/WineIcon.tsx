import React from 'react';
import { Wine, GlassWater, Droplets, Citrus } from 'lucide-react';

interface WineIconProps {
  color?: string;
  className?: string;
}

export function WineIcon({ color, className = "w-10 h-10" }: WineIconProps) {
  // Rotwein: Red Wine Glass
  if (color === 'Rot') {
    return <Wine className={`${className} text-red-800 fill-red-800/20`} />;
  }
  // Weißwein: White Wine Glass (using GlassWater or Wine with different color)
  if (color === 'Weiß') {
    return <GlassWater className={`${className} text-amber-200 fill-amber-100`} />;
  }
  // Rosé: Pink Wine Glass
  if (color === 'Rosé') {
    return <Droplets className={`${className} text-pink-400 fill-pink-200`} />;
  }
  // Orange: Orange Wine Glass
  if (color === 'Orange') {
    return <Citrus className={`${className} text-orange-400 fill-orange-200`} />;
  }
  
  // Default fallback
  return <Wine className={`${className} text-gray-400 fill-gray-100`} />;
}
