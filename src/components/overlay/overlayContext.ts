import { createContext } from "react";

export interface InteractionOrigin {
  x: number;
  y: number;
  target: Element | null;
  timestamp: number;
}

export interface OverlayRegistration {
  id: string;
  element: HTMLElement | null;
  trigger: HTMLElement | null;
  modal: boolean;
  onEscape: () => void;
  onOutside: () => void;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  destructive?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface OverlayContextValue {
  portalRoot: HTMLElement | null;
  register: (registration: OverlayRegistration) => () => void;
  update: (registration: OverlayRegistration) => void;
  getOrigin: (element: HTMLElement, trigger: HTMLElement | null) => string;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export const OverlayContext = createContext<OverlayContextValue | null>(null);
