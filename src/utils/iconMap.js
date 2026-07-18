import {
  BookOpen, Dumbbell, Droplet, Moon, Sun, Brain, Heart, Flame,
  Music, Code2, Leaf, Coffee, PenLine, Bike, Footprints, Sparkles,
} from 'lucide-react';

export const ICON_COMPONENTS = {
  BookOpen, Dumbbell, Droplet, Moon, Sun, Brain, Heart, Flame,
  Music, Code2, Leaf, Coffee, PenLine, Bike, Footprints, Sparkles,
};

export function resolveIcon(name) {
  return ICON_COMPONENTS[name] || Sparkles;
}
