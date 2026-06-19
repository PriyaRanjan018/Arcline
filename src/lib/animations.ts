export const animations = {
  pageEnter: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
  },
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.06
      }
    }
  },
  staggerItem: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35 }
  },
  cardHover: {
    whileHover: { y: -2, borderColor: 'var(--border-2)' },
    transition: { duration: 0.2 }
  }
};
