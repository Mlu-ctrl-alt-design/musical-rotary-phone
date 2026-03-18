import { Badge } from '@/components/ui/badge'

interface DocStatusBadgeProps {
  docstatus: 0 | 1 | 2
}

const STATUS_CONFIG = {
  0: { label: 'Draft', variant: 'blue' as const },
  1: { label: 'Submitted', variant: 'green' as const },
  2: { label: 'Cancelled', variant: 'gray' as const },
}

export function DocStatusBadge({ docstatus }: DocStatusBadgeProps) {
  const config = STATUS_CONFIG[docstatus] ?? STATUS_CONFIG[0]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
