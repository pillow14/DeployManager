import { Button } from '@/shared/components/Button'
import type { ButtonProps } from '@/shared/components/Button'

interface ActionButtonProps extends Omit<ButtonProps, 'children'> {
  icon?: string
  label: string
}

export function ActionButton({ icon, label, ...props }: ActionButtonProps) {
  return (
    <Button {...props}>
      {icon && (
        <span className="material-symbols-outlined mr-1.5 text-[18px]">{icon}</span>
      )}
      {label}
    </Button>
  )
}
