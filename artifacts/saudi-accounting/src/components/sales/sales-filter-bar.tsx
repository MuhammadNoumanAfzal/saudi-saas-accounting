import { useTranslation } from '@/lib/utils';
import { Search, Filter } from 'lucide-react';

interface FilterOption {
  value: string;
  labelEn: string;
  labelAr: string;
}

interface SalesFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  placeholderEn?: string;
  placeholderAr?: string;
  filterValue?: string;
  onFilterChange?: (val: string) => void;
  filterOptions?: FilterOption[];
  filterLabelEn?: string;
  filterLabelAr?: string;
}

export function SalesFilterBar({
  search,
  onSearchChange,
  placeholderEn = 'Search...',
  placeholderAr = 'بحث...',
  filterValue,
  onFilterChange,
  filterOptions,
}: SalesFilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="soft-card p-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder={t(placeholderEn, placeholderAr)}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 rtl:pr-9 rtl:pl-4 pr-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {filterOptions && onFilterChange && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={filterValue || ''}
              onChange={(e) => onFilterChange(e.target.value)}
              className="px-3 py-2 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelEn, opt.labelAr)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
