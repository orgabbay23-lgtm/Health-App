import React, { useMemo } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { useIsVisible } from '../hooks/useVisibilityState';

interface SafeLayoutMotionProps extends HTMLMotionProps<"div"> {
  children?: React.ReactNode;
}

/**
 * Drop-in replacement for <motion.div> that strips `layout` and `layoutId`
 * props when the iOS Safari tab is backgrounded. This prevents Framer Motion
 * from executing FLIP calculations against corrupted DOM metrics during
 * the freeze-thaw cycle, eliminating micro-refresh glitches.
 */
export const SafeLayoutMotion = React.forwardRef<HTMLDivElement, SafeLayoutMotionProps>(
  (props, ref) => {
    const isVisible = useIsVisible();

    const safeProps = useMemo(() => {
      if (!isVisible) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { layout, layoutId, ...rest } = props;
        return rest;
      }
      return props;
    }, [isVisible, props]);

    return <motion.div ref={ref} {...safeProps} />;
  }
);

SafeLayoutMotion.displayName = 'SafeLayoutMotion';
