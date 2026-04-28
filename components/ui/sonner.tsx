"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group doms-toaster"
      gap={8}
      icons={{
        success: <CircleCheckIcon className="size-4 text-green-600" />,
        info:    <InfoIcon className="size-4 text-blue-600" />,
        warning: <TriangleAlertIcon className="size-4 text-orange-500" />,
        error:   <OctagonXIcon className="size-4 text-red-600" />,
        loading: <Loader2Icon className="size-4 animate-spin text-gray-400" />,
      }}
      toastOptions={{
        duration: 3500,
        classNames: {
          title:       "!font-bold !text-gray-900 !text-sm",
          description: "!text-gray-500 !text-xs !mt-0.5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
