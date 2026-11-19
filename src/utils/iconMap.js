import {
  BookOpen, Dumbbell, Droplet, Moon, Sun, Brain, Heart, Flame,
  Music, Code2, Leaf, Coffee, PenLine, Bike, Footprints, Sparkles,
} from 'lucide-react';

export const ICON_COMPONENTS = {
  BookOpen, Dumbbell, Droplet, Moon, Sun, Brain, Heart, Flame,
  Music, Code2, Leaf, Coffee, PenLine, Bike, Footprints, Sparkles,
};

// The icon names a ritual can carry, in the order the pickers show them.
export const HABIT_ICONS = Object.keys(ICON_COMPONENTS);

export function resolveIcon(name) {
  return ICON_COMPONENTS[name] || Sparkles;
}
