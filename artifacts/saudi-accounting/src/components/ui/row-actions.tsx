import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/lib/utils';

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
        <Button
          type="button"
          variant="secondary"
          onClick={onView}
          title={viewLabel}
          className="h-8 w-8 p-0 flex items-center justify-center rounded-xl border border-border/80 bg-background hover:bg-primary/10 hover:border-primary/40 text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer shadow-xs"
        >
          <Eye size={15} />
        </Button>
      )}
      {onEdit && (
        <Button
          type="button"
          variant="secondary"
          onClick={onEdit}
          title={editLabel}
          className="h-8 w-8 p-0 flex items-center justify-center rounded-xl border border-border/80 bg-background hover:bg-amber-500/10 hover:border-amber-500/40 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-200 cursor-pointer shadow-xs"
        >
          <Pencil size={15} />
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          variant="secondary"
          onClick={onDelete}
          disabled={deleteDisabled}
          title={deleteLabel}
          className="h-8 w-8 p-0 flex items-center justify-center rounded-xl border border-border/80 bg-background hover:bg-red-500/10 hover:border-red-500/40 text-muted-foreground hover:text-red-500 transition-all duration-200 cursor-pointer shadow-xs disabled:opacity-40"
        >
          <Trash2 size={15} />
        </Button>
      )}
    </div>
  );
}