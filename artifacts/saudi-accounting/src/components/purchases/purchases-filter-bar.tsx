import { useTranslation } from '@/lib/utils';
import { Search, Filter } from 'lucide-react';

interface FilterOption {
  value: string;
  labelEn: string;
  labelAr: string;
}

interface PurchasesFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  placeholderEn?: string;
  placeholderAr?: string;
  filterValue?: string;
  onFilterChange?: (val: string) => void;
  filterOptions?: FilterOption[];
}

export function PurchasesFilterBar({
  search,
  onSearchChange,
  placeholderEn = 'Search...',
  placeholderAr = 'بحث...',
  filterValue,
  onFilterChange,
  filterOptions,
}: PurchasesFilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="relative w-full md:w-96">
        <Search className="w-4 h-4 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t(placeholderEn, placeholderAr)}
          className="w-full pl-9 rtl:pr-9 rtl:pl-3 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100"
        />
      </div>

      {filterOptions && onFilterChange && (
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterValue || ''}
              onChange={(e) => onFilterChange(e.target.value)}
              className="py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelEn, opt.labelAr)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
