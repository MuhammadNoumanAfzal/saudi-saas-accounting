import { Eye, Pencil, Trash2 } from 'lucide-react';

type RowActionsProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  deleteDisabled?: boolean;
};

export function RowActions({
  onView,
  onEdit,
  onDelete,
  viewLabel = 'View',
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  deleteDisabled = false,
}: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1.5 shrink-0">
      {onView && (
        <button
          type="button"
          onClick={onView}
          title={viewLabel}
          aria-label={viewLabel}
          className="h-8 w-8 rounded-xl border border-border bg-card hover:bg-primary/10 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center p-0 shrink-0"
        >
          <Eye size={15} className="shrink-0 stroke-[2] text-foreground hover:text-primary" />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title={editLabel}
          aria-label={editLabel}
          className="h-8 w-8 rounded-xl border border-border bg-card hover:bg-amber-500/10 hover:border-amber-500/40 text-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center p-0 shrink-0"
        >
          <Pencil size={15} className="shrink-0 stroke-[2] text-foreground hover:text-amber-600" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleteDisabled}
          title={deleteLabel}
          aria-label={deleteLabel}
          className="h-8 w-8 rounded-xl border border-border bg-card hover:bg-red-500/10 hover:border-red-500/40 text-muted-foreground hover:text-red-600 transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center p-0 shrink-0 disabled:opacity-40"
        >
          <Trash2 size={15} className="shrink-0 stroke-[2] text-red-500" />
        </button>
      )}
    </div>
  );
}