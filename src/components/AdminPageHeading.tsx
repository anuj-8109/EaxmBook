import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminPageHeadingProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}

export const AdminPageHeading = ({
  title,
  description,
  eyebrow = 'Overview',
  action,
  className,
}: AdminPageHeadingProps) => {
  return (
    <div
      className={cn(
        'rounded-[1.75rem] border border-border/60 bg-card/95 px-4 py-4 sm:px-5 sm:py-5 shadow-md shadow-black/5 backdrop-blur flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div>
        {eyebrow && (
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/70">
            {eyebrow}
          </p>
        )}
        <h1 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h1>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2 text-xs">{action}</div>}
    </div>
  );
};

export default AdminPageHeading;

