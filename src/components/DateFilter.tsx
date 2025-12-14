import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

export type FilterType = 'all' | 'today' | 'week' | 'month' | 'custom';

interface DateFilterProps {
  onFilterChange: (filter: { type: FilterType; start?: string; end?: string }) => void;
}

export function DateFilter({ onFilterChange }: DateFilterProps) {
  const [type, setType] = useState<FilterType>('all');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    onFilterChange({ type, start, end });
  }, [type, start, end]);

  return (
    <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
      <div className="flex items-center gap-2 text-slate-600 mr-2">
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Période:</span>
      </div>
      
      {(['all', 'today', 'week', 'month', 'custom'] as const).map((t) => (
        <button
          key={t}
          onClick={() => setType(t)}
          className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
            type === t 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          {t === 'all' && 'Tout'}
          {t === 'today' && "Aujourd'hui"}
          {t === 'week' && '7 Jours'}
          {t === 'month' && 'Mois'}
          {t === 'custom' && 'Custom'}
        </button>
      ))}

      {type === 'custom' && (
        <div className="flex items-center gap-2 ml-2 animate-in fade-in">
          <input 
            type="date" 
            value={start} 
            onChange={(e) => setStart(e.target.value)}
            className="px-2 py-1 text-xs border border-slate-300 rounded"
          />
          <span className="text-slate-400">-</span>
          <input 
            type="date" 
            value={end} 
            onChange={(e) => setEnd(e.target.value)}
            className="px-2 py-1 text-xs border border-slate-300 rounded"
          />
        </div>
      )}
    </div>
  );
}

export function filterListByDate<T extends { date: string }>(
  items: T[], 
  filter: { type: FilterType; start?: string; end?: string }
): T[] {
  if (filter.type === 'all') return items;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekAgo = today - (7 * 24 * 60 * 60 * 1000);
  const monthAgo = today - (30 * 24 * 60 * 60 * 1000);

  return items.filter(item => {
    const itemDate = new Date(item.date).getTime();
    
    switch (filter.type) {
      case 'today': return itemDate >= today;
      case 'week': return itemDate >= weekAgo;
      case 'month': return itemDate >= monthAgo;
      case 'custom':
        if (!filter.start || !filter.end) return true;
        const s = new Date(filter.start).getTime();
        const e = new Date(filter.end).getTime();
        // Add one day to end date to include it fully
        const eEndOfDay = e + (24 * 60 * 60 * 1000) - 1;
        return itemDate >= s && itemDate <= eEndOfDay;
      default: return true;
    }
  });
}