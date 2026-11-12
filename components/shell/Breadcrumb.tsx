import Link from "next/link";
import { Fragment } from "react";
import { IconBreadcrumbSep } from "@/components/icons";
import { tr } from "@/lib/i18n";

type Crumb = { label: string; href?: string; dotColor?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label={tr().ui.breadcrumb} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12.5px] text-ink-muted">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        const body = (
          <span className="inline-flex items-center gap-1.5">
            {item.dotColor && (
              <span className="size-2 shrink-0 rounded-[2px]" style={{ background: item.dotColor }} />
            )}
            <span className={last ? "text-[13px] font-semibold text-ink" : undefined}>{item.label}</span>
          </span>
        );
        return (
          <Fragment key={item.label}>
            {i > 0 && <IconBreadcrumbSep size={13} className="shrink-0 text-ink-disabled" />}
            {item.href && !last ? (
              <Link href={item.href} className="hover:text-ink">
                {body}
              </Link>
            ) : (
              body
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
