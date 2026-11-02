/**
 * The default theme, resolved. `#decks/theme` points here (package.json
 * `imports`) wherever the Vite plugin in `vite.config.mts` is not running:
 * tests, `tsc`, plain Node. Inside a deck the plugin answers instead, with the
 * deck's `theme.json` merged over the same defaults.
 */
import defaults from './default.json'
import { resolveTheme } from './resolve'

export default resolveTheme(defaults)
