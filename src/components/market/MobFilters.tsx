import { AppImage } from '../ui/AppImage';
import type { MobFilterOption, MobFilter } from './constants';

interface MobFiltersProps {
  filters: MobFilterOption[];
  selectedFilter: MobFilter;
  onSelectFilter: (filter: MobFilter) => void;
  /** Active color variant - 'light' for market, 'dark' for collection */
  variant?: 'light' | 'dark';
}

export function MobFilters({ 
  filters, 
  selectedFilter, 
  onSelectFilter,
  variant = 'light'
}: MobFiltersProps) {
  const activeClass = variant === 'dark' 
    ? 'bg-slate-700 text-white' 
    : 'bg-slate-400 text-white';
  
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mt-2 -mx-4 px-4">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onSelectFilter(filter.id)}
          style={{ width: 'fit-content', minWidth: 'fit-content' }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
            selectedFilter === filter.id
              ? activeClass
              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
          }`}
        >
          <AppImage src={filter.icon} alt={filter.name} className="w-4 h-4 object-contain shrink-0" />
          {filter.name}
        </button>
      ))}
      {/* Spacer to ensure last item is fully visible when scrolling */}
      <div className="shrink-0 w-1" />
    </div>
  );
}
