import type { MetaData } from "types";
import { getFavicon } from "./favicon";

export function getMetaDataFromTags(): MetaData {
  const icon = getFavicon();

  if (typeof document === 'undefined') {
    return { icon };
  }

  const metaTags = document.getElementsByTagName('meta');
  let description: string = '';
  let title: string = document.title || '';

  for (let i = 0; i < metaTags.length; i++) {
    const meta = metaTags[i];
    const name = meta.getAttribute('name') || meta.getAttribute('property');
    const content = meta.getAttribute('content');

    if (!name || !content) continue;

    const nameLower = name.toLowerCase();
    
    if (nameLower === 'description' || nameLower === 'og:description') {
      description = content;
    } else if ((nameLower === 'title' || nameLower === 'og:title') && !title) {
      title = content;
    }
  }

  const colorData = extractColors();
  
  return {
    description,
    title,
    colors: colorData,
    icon,
  };
}

function extractColors() {
  const colorCollections = {
    backgrounds: new Set<string>(),
    texts: new Set<string>(),
    buttons: new Set<string>(),
    borders: new Set<string>(),
    links: new Set<string>(),
    headings: new Set<string>(),
    inputs: new Set<string>(),
    accents: new Set<string>(),
  };

  const rootStyles = getComputedStyle(document.documentElement);
  const cssVarColors = extractCssVariableColors(rootStyles);
  
  const bodyStyles = getComputedStyle(document.body);
  const bodyBgColor = normalizeColor(bodyStyles.backgroundColor);
  const bodyTextColor = normalizeColor(bodyStyles.color);
  
  colorCollections.backgrounds.add(bodyBgColor);
  colorCollections.texts.add(bodyTextColor);

  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    const styles = getComputedStyle(heading);
    colorCollections.headings.add(normalizeColor(styles.color));
  });

  const links = document.querySelectorAll('a');
  links.forEach(link => {
    const styles = getComputedStyle(link);
    colorCollections.links.add(normalizeColor(styles.color));
  });

  const buttons = document.querySelectorAll('button, .btn, [class*="button"], [type="button"], [type="submit"]');
  const buttonColors: string[] = [];
  
  buttons.forEach(button => {
    const styles = getComputedStyle(button);
    const bgColor = normalizeColor(styles.backgroundColor);
    const textColor = normalizeColor(styles.color);
    const borderColor = normalizeColor(styles.borderColor);
    
    if (bgColor !== 'transparent' && bgColor !== bodyBgColor) {
      buttonColors.push(bgColor);
      colorCollections.buttons.add(bgColor);
    }
    
    colorCollections.texts.add(textColor);
    
    if (borderColor !== 'transparent') {
      colorCollections.borders.add(borderColor);
    }
  });

  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const styles = getComputedStyle(input);
    const bgColor = normalizeColor(styles.backgroundColor);
    const borderColor = normalizeColor(styles.borderColor);
    
    colorCollections.inputs.add(bgColor);
    colorCollections.borders.add(borderColor);
  });

  const accentElements = document.querySelectorAll(
    '[class*="accent"], [class*="primary"], [class*="highlight"], [class*="brand"], ' +
    '[class*="main"], [class*="active"], [class*="selected"], [class*="focus"]'
  );
  
  accentElements.forEach(element => {
    const styles = getComputedStyle(element);
    const bgColor = normalizeColor(styles.backgroundColor);
    if (bgColor !== 'transparent' && bgColor !== bodyBgColor) {
      colorCollections.accents.add(bgColor);
    }
  });

  let primary: string | undefined;
  let secondary: string | undefined;
  
  if (cssVarColors.primary) {
    primary = cssVarColors.primary;
  } else {
    const mostCommonButtonColor = findMostCommonColor(buttonColors);
    if (mostCommonButtonColor) {
      primary = mostCommonButtonColor;
    } else if (colorCollections.accents.size > 0) {
      primary = Array.from(colorCollections.accents)[0];
    } else if (colorCollections.links.size > 0) {
      primary = Array.from(colorCollections.links)[0];
    }
  }

  if (cssVarColors.secondary) {
    secondary = cssVarColors.secondary;
  } else if (cssVarColors.accent) {
    secondary = cssVarColors.accent;
  } else if (primary && buttonColors.length > 1) {
    secondary = buttonColors.filter(color => color !== primary)[0];
  } else if (colorCollections.accents.size > 1) {
    const accentColors = Array.from(colorCollections.accents);
    secondary = accentColors.find(color => color !== primary) || accentColors[0];
  }

  if (!primary && buttons.length > 0) {
    const primaryButton = findPrimaryButton(buttons);
    if (primaryButton) {
      primary = normalizeColor(getComputedStyle(primaryButton).backgroundColor);
    }
  }

  return {
    primary,
    secondary,
    background: bodyBgColor,
    text: bodyTextColor,
  };
}

function findPrimaryButton(buttons: NodeListOf<Element>): Element | null {
  for (const button of buttons) {
    const className = button.className.toLowerCase();
    if (
      className.includes('primary') ||
      className.includes('main') ||
      className.includes('cta') ||
      className.includes('submit')
    ) {
      return button;
    }
  }

  const submitButton = Array.from(buttons).find(
    button => (button as HTMLButtonElement).type === 'submit'
  );
  if (submitButton) return submitButton;

  return buttons.length > 0 ? buttons[0] : null;
}

function extractCssVariableColors(styles: CSSStyleDeclaration) {
  const result: Record<string, string> = {};
  const colorVars = [
    '--primary',
    '--primary-color',
    '--secondary',
    '--secondary-color',
    '--accent',
    '--accent-color',
    '--background',
    '--background-color',
    '--text',
    '--text-color',
    '--color-primary',
    '--color-secondary',
    '--color-accent',
    '--color-background',
    '--color-text',
    '--theme-primary',
    '--theme-secondary',
  ];

  for (const varName of colorVars) {
    const value = styles.getPropertyValue(varName).trim();
    if (value) {
      const normalizedColor = normalizeColor(value);
      const keyName = varName.replace('--', '').replace('-color', '').replace('color-', '').replace('theme-', '');
      result[keyName] = normalizedColor;
    }
  }

  return result;
}

function findMostCommonColor(colors: string[]): string | undefined {
  if (colors.length === 0) return undefined;
  
  const colorCount: Record<string, number> = {};
  for (const color of colors) {
    colorCount[color] = (colorCount[color] || 0) + 1;
  }
  
  let maxCount = 0;
  let mostCommonColor = undefined;
  
  for (const [color, count] of Object.entries(colorCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonColor = color;
    }
  }
  
  return mostCommonColor;
}

function normalizeColor(color: string): string {
  color = color.trim().toLowerCase();
  
  if (color.startsWith('#')) {
    return color;
  }
  
  if (color.startsWith('rgb')) {
    return rgbToHex(color);
  }
  
  if (color === 'transparent') {
    return 'transparent';
  }
  
  try {
    const tempEl = document.createElement('div');
    tempEl.style.color = color;
    document.body.appendChild(tempEl);
    const computed = getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);
    return rgbToHex(computed);
  } catch (e) {
    return color;
  }
}

function rgbToHex(rgb: string): string {
  const rgba = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/);
  if (!rgba) return rgb;
  
  const r = parseInt(rgba[1], 10);
  const g = parseInt(rgba[2], 10);
  const b = parseInt(rgba[3], 10);
  
  if (rgba[4] !== undefined) {
    const a = Math.round(parseFloat(rgba[4]) * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a.toString(16).padStart(2, '0')}`;
  }
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

