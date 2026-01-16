import { AppImage } from '../ui/AppImage';
import type { CategoryOption, ItemCategory } from './constants';

interface CategoryTabsProps {
  categories: CategoryOption[];
  selectedCategory: ItemCategory;
  onSelectCategory: (category: ItemCategory) => void;
}

export function CategoryTabs({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
            selectedCategory === cat.id
              ? 'bg-primary-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <AppImage src={cat.icon} alt={cat.name} className="w-5 h-5 object-contain shrink-0" />
          {cat.name}
        </button>
      ))}
    </div>
  );
}
