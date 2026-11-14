/**
 * The seven products, in the order work flows through them. The one source
 * for names, verbs, language chips and pixel icons: the thread rail and every
 * name plate read this file.
 *
 * Names, casing and order: OUTLINE.md section 3.
 * Icons: copied from ~/Projects/steamfield/src/data/pixel-icons.ts (read
 * 2026-11-13, steamfield commit 53a1a06). One character per pixel: "." is
 * empty; p, c, y, v, w are pink, cyan, yellow, violet and white.
 * Languages: read from each repo on 2026-11-13; sourced in data-sources.md
 * under "Every slide: product chips".
 */

export type ProductId = 'stacks' | 'foreman' | 'rr' | 'statglass' | 'opendata' | 'openchart' | 'decks'

export interface Product {
  id: ProductId
  name: string
  /** The step this product is in the thread. */
  verb: string
  /** What its language chip says. */
  lang: string
  icon: readonly string[]
}

export const PRODUCTS: readonly Product[] = [
  {
    id: 'stacks',
    name: 'Stacks',
    verb: 'Start',
    lang: 'TypeScript · Effect 4',
    icon: [
      '....yyyy....',
      '....yyyy....',
      '............',
      '..pppppppp..',
      '..pppppppp..',
      '............',
      '.cccccccccc.',
      '.cccccccccc.',
      '............',
      'vvvvvvvvvvvv',
      'vvvvvvvvvvvv',
      '............',
    ],
  },
  {
    id: 'foreman',
    name: 'foreman',
    verb: 'Delegate',
    lang: 'TypeScript · Effect 4',
    icon: [
      '............',
      'vv..cc..pp..',
      '.vv..cc..pp.',
      '..vv..cc..pp',
      '...vv..cc..p',
      '....vv..cc.p',
      '...vv..cc..p',
      '..vv..cc..pp',
      '.vv..cc..pp.',
      'vv..cc..pp..',
      '............',
      '............',
    ],
  },
  {
    id: 'rr',
    name: 'rr',
    verb: 'Test',
    lang: 'Go',
    icon: [
      'cccccccccccc',
      'c..........c',
      'c.p........c',
      'c..p.......c',
      'c...p......c',
      'c..p.......c',
      'c.p..yyyy..c',
      'c..........c',
      'cccccccccccc',
      '....cccc....',
      '..cccccccc..',
      '............',
    ],
  },
  {
    id: 'statglass',
    name: 'StatGlass',
    verb: 'Watch',
    lang: 'Rust + TypeScript',
    icon: [
      '...cccc.....',
      '..c....c....',
      '.c...p..c...',
      '.c...p..c...',
      '.c..pp..c...',
      '.c.ppp..c...',
      '..c....c....',
      '...cccc.y...',
      '.......yy...',
      '........yy..',
      '.........yy.',
      '..........y.',
    ],
  },
  {
    id: 'opendata',
    name: 'OpenData',
    verb: 'Ask',
    lang: 'TypeScript · Python engine',
    icon: [
      '............',
      '.........yy.',
      '......cc.yy.',
      '......cc.yy.',
      '...pp.cc.yy.',
      '...pp.cc.yy.',
      'vv.pp.cc.yy.',
      'vv.pp.cc.yy.',
      'vv.pp.cc.yy.',
      'vv.pp.cc.yy.',
      'wwwwwwwwwwww',
      '............',
    ],
  },
  {
    id: 'openchart',
    name: 'OpenChart',
    verb: 'Chart',
    lang: 'TypeScript',
    icon: [
      '............',
      '..........yy',
      '.........y..',
      '........y...',
      '...pp..y....',
      '..p..pp.....',
      '.p..........',
      'p...........',
      'c...........',
      'c...........',
      'cccccccccccc',
      '............',
    ],
  },
  {
    id: 'decks',
    name: 'Decks',
    verb: 'Present',
    lang: 'TypeScript · Vue',
    icon: [
      '............',
      '....vvvvvvvv',
      '....vvvvvvvv',
      '....vvvvvvvv',
      '.........vvv',
      'cccccccc.vvv',
      'cccccccc.vvv',
      'cccccccc.vvv',
      'cccccccc....',
      'cccccccc....',
      'cccccccc....',
      '............',
    ],
  },
]

export function product(id: ProductId): Product {
  const found = PRODUCTS.find((p) => p.id === id)
  if (!found) throw new Error(`products: unknown id ${id}`)
  return found
}
