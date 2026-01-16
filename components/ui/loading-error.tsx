import { IconLoader2 } from "@tabler/icons-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
}

export function LoadingSpinner({ size = "md", text = "Loading..." }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <IconLoader2 className={`${sizeClasses[size]} animate-spin`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}

interface ErrorAlertProps {
  error: string
  onRetry?: () => void
}

export function ErrorAlert({ error, onRetry }: ErrorAlertProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-medium">Error loading data</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 rounded bg-red-200 px-3 py-1 text-sm font-medium hover:bg-red-300 dark:bg-red-800 dark:hover:bg-red-700"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}
