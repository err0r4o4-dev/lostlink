import { forwardRef, type ReactNode } from 'react'

import { Button, type ButtonProps } from './button'

interface IconButtonProps extends Omit<ButtonProps, 'aria-label' | 'children' | 'size'> {
  'aria-label': string
  children: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { children, ...props },
  ref,
) {
  return (
    <Button ref={ref} size="icon" {...props}>
      {children}
    </Button>
  )
})
