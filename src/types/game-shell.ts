import type { ReactNode } from "react";

export type HelpSheetContent = {
  rules?: ReactNode;
  examples?: ReactNode;
  scoring?: ReactNode;
  shortcuts?: ReactNode;
};

export type BottomBarActions = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
};

export type GameShellProps = {
  headerLeft?: ReactNode;
  headerCenter?: ReactNode;
  headerRight?: ReactNode;
  contextStrip?: ReactNode;
  primaryCard: ReactNode;
  secondaryCard?: ReactNode;
  feedbackSlot?: ReactNode;
  bottomCoreActions?: BottomBarActions;
  bottomGameControls?: ReactNode;
  helpSheetContent?: HelpSheetContent;
  statsSheetContent?: ReactNode;
  moreSheetContent?: ReactNode;
  className?: string;
};
