interface Props {
  color: string
  className?: string
  variant?: 1 | 2 | 3
}

/** Watercolor-style irregular swatch */
export function ColorBlob({ color, className = '', variant = 1 }: Props) {
  const shape = variant === 1 ? 'blob' : variant === 2 ? 'blob-2' : 'blob-3'
  return (
    <div
      className={`${shape} watercolor ${className}`}
      style={{ backgroundColor: color }}
    />
  )
}
