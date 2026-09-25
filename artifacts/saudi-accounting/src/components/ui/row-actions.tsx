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
    <div className="flex items-center justify-end gap-1.5">
      {onView && (
        <Button
          type="button"
          variant="secondary"
          onClick={onView}
          title={viewLabel}
          className="h-8 px-2.5 py-1 text-xs font-bold gap-1 shadow-none"
        >
          <Eye size={14} />
          <span className="hidden lg:inline">{viewLabel}</span>
        </Button>
      )}
      {onEdit && (
        <Button
          type="button"
          variant="secondary"
          onClick={onEdit}
          title={editLabel}
          className="h-8 px-2.5 py-1 text-xs font-bold gap-1 shadow-none"
        >
          <Pencil size={14} />
          <span className="hidden lg:inline">{editLabel}</span>
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          variant="secondary"
          onClick={onDelete}
          disabled={deleteDisabled}
          title={deleteLabel}
          className="h-8 px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-none"
        >
          <Trash2 size={14} />
        </Button>
      )}
    </div>
  );
}