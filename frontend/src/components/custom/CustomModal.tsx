import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SIZE_MAP = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-3xl",
};

interface CustomModalProps {
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  size?: keyof typeof SIZE_MAP;
  contentClassName?: string;
  /** When true, the modal only closes via the X button / Cancel — not by
   * clicking the backdrop, dragging a selection outside, or pressing Escape. */
  disableOutsideClose?: boolean;
}

const CustomModal = ({
  open,
  onClose,
  onOpenChange,
  title,
  children,
  trigger,
  size = "md",
  contentClassName,
  disableOutsideClose,
}: CustomModalProps) => {
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange?.(isOpen);
    if (!isOpen) onClose?.();
  };

  const guardProps = disableOutsideClose
    ? {
        onInteractOutside: (e: Event) => e.preventDefault(),
        onEscapeKeyDown: (e: KeyboardEvent) => e.preventDefault(),
      }
    : {};

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(SIZE_MAP[size], contentClassName)}
        {...guardProps}
      >
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default CustomModal;
