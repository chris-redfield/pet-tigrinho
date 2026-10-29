import { ICONS } from '../config.js';
import { ICON_ART } from '../sprites.js';
import { h, svg, actionCfg } from './dom.js';

const EGG_PATH = 'M50 6c20 0 36 26 36 50 0 24-16 38-36 38S14 80 14 56C14 32 30 6 50 6z';

let clipSeq = 0;

/** A decorated egg. Purely cosmetic - all three hatch the same pet. */
export function eggArt({ shell, band, speck }) {
  const clipId = `egg-clip-${clipSeq++}`;
  return svg('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' },
    svg('defs', {},
      svg('clipPath', { id: clipId }, svg('path', { d: EGG_PATH }))),
    svg('g', { 'clip-path': `url(#${clipId})` },
      svg('path', { d: EGG_PATH, fill: shell }),
      svg('rect', { x: 0, y: 46, width: 100, height: 11, fill: band }),
      svg('rect', { x: 0, y: 61, width: 100, height: 3.5, fill: band, opacity: .75 }),
      svg('circle', { cx: 34, cy: 24, r: 3.6, fill: speck }),
      svg('circle', { cx: 58, cy: 32, r: 2.6, fill: speck }),
      svg('circle', { cx: 44, cy: 76, r: 3.2, fill: speck }),
      svg('circle', { cx: 66, cy: 84, r: 2.4, fill: speck }),
      svg('ellipse', { cx: 36, cy: 32, rx: 11, ry: 17, fill: '#fff', opacity: .16 })),
    svg('path', { d: EGG_PATH, fill: 'none', stroke: '#00000038', 'stroke-width': 2.5 }));
}

/** The trilha coin (a Chinese cash coin). Decorative: the number beside it carries the meaning. */
export function coinArt(className) {
  return h('img', { class: className, src: 'assets/fx/coin.webp', alt: '', 'aria-hidden': 'true' });
}

/** 24x24 line-art glyph from a path string in config.ICONS. */
export function iconArt(d, className) {
  return svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', class: className },
    svg('path', { d }));
}

/**
 * The icon for one of the five actions: its own generated art when there is
 * some (`ICON_ART`), otherwise the built-in gold glyph. `className--art`
 * is added to the image so CSS can size the two differently. Passos shows
 * a wheelchair for players who use one (see actionCfg).
 */
export function actionIcon(type, className) {
  const icon = actionCfg(type).icon;
  return ICON_ART.includes(icon)
    ? h('img', { class: `${className} ${className}--art`, src: `assets/icons/${icon}.webp`, alt: '' })
    : iconArt(ICONS[icon], className);
}
