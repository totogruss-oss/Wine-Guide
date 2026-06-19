import React from 'react';
import { 
  Grape, Cherry, Apple, Citrus, Leaf, Sprout, Flower2, 
  Flame, Droplet, Sun, Mountain, Nut, Sparkles, Wheat,
  Feather, Clover, TreePine, Shell
} from 'lucide-react';

const FALLBACK_ICONS = [
  Grape, Cherry, Apple, Citrus, Leaf, Sprout, Flower2, 
  Droplet, Sun, Mountain, Nut, Sparkles, Wheat, Feather, Clover
];

const FALLBACK_COLORS = [
  'text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500', 
  'text-purple-500', 'text-pink-500', 'text-indigo-500', 'text-teal-500', 
  'text-orange-500', 'text-cyan-500', 'text-rose-500', 'text-fuchsia-500', 
  'text-violet-500', 'text-emerald-500', 'text-lime-500', 'text-amber-500'
];

interface SemanticMapping {
  icon: React.ElementType;
  color: string;
}

const SEMANTIC_MAPPINGS: Record<string, SemanticMapping> = {
  // Weißweine
  "Riesling": { icon: Citrus, color: 'text-lime-500' },
  "Chardonnay": { icon: Apple, color: 'text-yellow-500' },
  "Sauvignon Blanc": { icon: Leaf, color: 'text-green-500' },
  "Grauburgunder (Pinot Gris)": { icon: Nut, color: 'text-amber-600' },
  "Pinot Grigio": { icon: Nut, color: 'text-amber-600' },
  "Weißburgunder": { icon: Apple, color: 'text-green-400' },
  "Pinot Blanc": { icon: Apple, color: 'text-green-400' },
  "Müller-Thurgau (Rivaner)": { icon: Flower2, color: 'text-yellow-400' },
  "Gewürztraminer": { icon: Flower2, color: 'text-pink-400' },
  "Silvaner": { icon: Sprout, color: 'text-lime-600' },
  "Grüner Veltliner": { icon: Leaf, color: 'text-green-600' },
  "Bacchus": { icon: Grape, color: 'text-lime-400' },
  "Chenin Blanc": { icon: Apple, color: 'text-yellow-300' },
  "Gutedel": { icon: Sprout, color: 'text-green-300' },
  "Kerner": { icon: Citrus, color: 'text-lime-500' },
  "Scheurebe": { icon: Citrus, color: 'text-yellow-400' },
  "Viognier": { icon: Flower2, color: 'text-orange-300' },
  "Glera": { icon: Sparkles, color: 'text-yellow-400' }, // Prosecco

  // Rotweine
  "Cabernet Sauvignon": { icon: Grape, color: 'text-red-800' },
  "Merlot": { icon: Cherry, color: 'text-red-600' },
  "Spätburgunder": { icon: Cherry, color: 'text-red-500' },
  "Pinot Noir": { icon: Cherry, color: 'text-red-500' },
  "Syrah (Shiraz)": { icon: Flame, color: 'text-purple-700' },
  "Primitivo (Zinfandel)": { icon: Sun, color: 'text-red-700' },
  "Dornfelder": { icon: Grape, color: 'text-purple-900' },
  "Tempranillo": { icon: Leaf, color: 'text-red-700' },
  "Sangiovese": { icon: Cherry, color: 'text-red-600' },
  "Blaufränkisch": { icon: Grape, color: 'text-indigo-700' },
  "Lemberger (Blaufränkisch)": { icon: Grape, color: 'text-indigo-700' },
  "Zweigelt": { icon: Cherry, color: 'text-purple-600' },
  "Malbec": { icon: Mountain, color: 'text-purple-800' },
  "Cabernet Franc": { icon: Leaf, color: 'text-red-800' },
  "Barbera": { icon: Cherry, color: 'text-rose-700' },
  "Carmenère": { icon: Leaf, color: 'text-rose-800' },
  "Montepulciano": { icon: Grape, color: 'text-fuchsia-800' },
  "Nebbiolo": { icon: Droplet, color: 'text-red-800' },
  "Nero d'Avola": { icon: Sun, color: 'text-purple-800' },
  "Portugieser": { icon: Grape, color: 'text-red-400' },
  "Regent": { icon: Grape, color: 'text-purple-800' },
  "Schwarzriesling": { icon: Grape, color: 'text-red-600' },
  "Trollinger": { icon: Cherry, color: 'text-red-400' }
};

interface RebsorteIconProps {
  rebsorte?: string;
  className?: string;
}

export function RebsorteIcon({ rebsorte, className = "w-4 h-4" }: RebsorteIconProps) {
  if (!rebsorte) {
    return <Grape className={`${className} text-gray-400`} />;
  }

  // Check for semantic mapping first
  const mapping = SEMANTIC_MAPPINGS[rebsorte];
  if (mapping) {
    const Icon = mapping.icon;
    return <Icon className={`${className} ${mapping.color}`} />;
  }

  // Fallback: Simple deterministic hash function for unknown varietals
  let hash = 0;
  for (let i = 0; i < rebsorte.length; i++) {
    hash = rebsorte.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const absHash = Math.abs(hash);
  const Icon = FALLBACK_ICONS[absHash % FALLBACK_ICONS.length];
  const colorClass = FALLBACK_COLORS[absHash % FALLBACK_COLORS.length];

  return <Icon className={`${className} ${colorClass}`} />;
}
