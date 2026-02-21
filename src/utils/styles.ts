// Utility to convert Tailwind classes to React Native styles
// This is a simplified version - in production, you'd use a proper TW-to-RN converter

export const tw = (classes: string): object => {
  const styles: any = {};
  const classList = classes.split(/\s+/);

  classList.forEach((cls) => {
    switch (cls) {
      // Flex
      case 'flex-1': styles.flex = 1; break;
      case 'flex-row': styles.flexDirection = 'row'; break;
      case 'flex-wrap': styles.flexWrap = 'wrap'; break;
      case 'items-center': styles.alignItems = 'center'; break;
      case 'justify-center': styles.justifyContent = 'center'; break;
      case 'justify-between': styles.justifyContent = 'space-between'; break;
      case 'justify-end': styles.justifyContent = 'flex-end'; break;
      
      // Padding
      case 'p-2': styles.padding = 8; break;
      case 'p-3': styles.padding = 12; break;
      case 'p-4': styles.padding = 16; break;
      case 'px-2': styles.paddingHorizontal = 8; break;
      case 'px-4': styles.paddingHorizontal = 16; break;
      case 'py-4': styles.paddingVertical = 16; break;
      case 'pt-4': styles.paddingTop = 16; break;
      case 'pt-16': styles.paddingTop = 64; break;
      case 'pb-4': styles.paddingBottom = 16; break;
      case 'pb-20': styles.paddingBottom = 80; break;
      
      // Margin
      case 'm-2': styles.margin = 8; break;
      case 'm-4': styles.margin = 16; break;
      case 'mb-4': styles.marginBottom = 16; break;
      case 'mb-6': styles.marginBottom = 24; break;
      case 'mr-2': styles.marginRight = 8; break;
      case 'mr-3': styles.marginRight = 12; break;
      case 'mt-2': styles.marginTop = 8; break;
      case 'mt-4': styles.marginTop = 16; break;
      case 'ml-2': styles.marginLeft = 8; break;
      case 'ml-3': styles.marginLeft = 12; break;
      case 'mx-2': styles.marginHorizontal = 8; break;
      
      // Width/Height
      case 'w-6': styles.width = 24; break;
      case 'w-8': styles.width = 32; break;
      case 'w-14': styles.width = 56; break;
      case 'w-full': styles.width = '100%'; break;
      case 'h-6': styles.height = 24; break;
      case 'h-8': styles.height = 32; break;
      case 'h-14': styles.height = 56; break;
      case 'h-20': styles.height = 80; break;
      case 'h-40': styles.height = 160; break;
      
      // Position
      case 'absolute': styles.position = 'absolute'; break;
      case 'relative': styles.position = 'relative'; break;
      case 'inset-0': styles.top = 0; styles.left = 0; styles.right = 0; styles.bottom = 0; break;
      case 'bottom-0': styles.bottom = 0; break;
      case 'bottom-6': styles.bottom = 24; break;
      case 'right-0': styles.right = 0; break;
      case 'right-6': styles.right = 24; break;
      case 'left-0': styles.left = 0; break;
      case 'top-0': styles.top = 0; break;
      
      // Border
      case 'rounded-full': styles.borderRadius = 9999; break;
      case 'rounded-2xl': styles.borderRadius = 16; break;
      case 'rounded-lg': styles.borderRadius = 8; break;
      case 'border-2': styles.borderWidth = 2; break;
      case 'border-transparent': styles.borderColor = 'transparent'; break;
      
      // Overflow
      case 'overflow-hidden': styles.overflow = 'hidden'; break;
      
      // Text
      case 'text-center': styles.textAlign = 'center'; break;
      case 'text-white': styles.color = '#FFFFFF'; break;
      case 'text-base': styles.fontSize = 16; break;
      case 'text-sm': styles.fontSize = 14; break;
      case 'text-lg': styles.fontSize = 18; break;
      case 'text-xl': styles.fontSize = 20; break;
      case 'text-2xl': styles.fontSize = 24; break;
      case 'font-semibold': styles.fontWeight = '600'; break;
      case 'font-bold': styles.fontWeight = '700'; break;
      
      // Opacity
      case 'opacity-50': styles.opacity = 0.5; break;
      case 'opacity-70': styles.opacity = 0.7; break;
      
      // Gap/Space
      case 'gap-2': styles.gap = 8; break;
      case 'gap-4': styles.gap = 16; break;
      case 'space-y-3': styles.gap = 12; break;
      
      // Z-Index
      case 'z-10': styles.zIndex = 10; break;
      case 'z-50': styles.zIndex = 50; break;
      
      default:
        // Handle arbitrary values like bg-white/80
        if (cls.startsWith('bg-')) {
          // Extract color - simplified
          const colorName = cls.replace('bg-', '').split('/')[0];
          if (colorName === 'white') styles.backgroundColor = '#FFFFFF';
          if (colorName === 'black') styles.backgroundColor = '#000000';
        }
        break;
    }
  });

  return styles;
};
