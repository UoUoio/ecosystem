import { addViteConfig } from '@vuepress/helper'
import { watch } from 'chokidar'
import type { PluginFunction } from 'vuepress/core'
import { getDirname, path } from 'vuepress/utils'
import { injectScssConfigModule } from './injectScssConfigModule.js'
import type { SassPalettePluginOptions } from './options.js'
import {
  prepareClientConfigFile,
  prepareConfigSass,
  prepareInjectSass,
  preparePaletteSass,
  prepareStyleSass,
} from './prepare/index.js'
import { EMPTY_FILE, PLUGIN_NAME, getIdPrefix, logger } from './utils.js'

const __dirname = getDirname(import.meta.url)

export const sassPalettePlugin =
  (options: SassPalettePluginOptions): PluginFunction =>
  (app) => {
    if (app.env.isDebug) logger.info('Options:', options)

    const {
      id = '',
      config = `.vuepress/styles/${getIdPrefix(id)}config.scss`,
      defaultConfig = path.resolve(
        __dirname,
        '../../styles/default/config.scss',
      ),
      palette = `.vuepress/styles/${getIdPrefix(id)}palette.scss`,
      defaultPalette,
      generator = EMPTY_FILE,
      style = '',
    } = options

    const userConfig = app.dir.source(config)
    const userPalette = app.dir.source(palette)
    const userStyle = style ? app.dir.source(style) : null

    return {
      name: PLUGIN_NAME,

      multiple: true,

      id,

      alias: {
        [`@sass-palette/helper`]: path.resolve(
          __dirname,
          '../../styles/helper.scss',
        ),
        [`@sass-palette/${getIdPrefix(id)}config`]: app.dir.temp(
          `sass-palette/${getIdPrefix(id)}config.scss`,
        ),
        [`@sass-palette/${getIdPrefix(id)}inject`]: app.dir.temp(
          `sass-palette/${getIdPrefix(id)}inject.scss`,
        ),
        [`@sass-palette/${getIdPrefix(id)}palette`]: app.dir.temp(
          `sass-palette/${getIdPrefix(id)}palette.scss`,
        ),
        ...(style
          ? {
              [`@sass-palette/${getIdPrefix(id)}style`]: app.dir.temp(
                `sass-palette/${getIdPrefix(id)}style.scss`,
              ),
            }
          : {}),
      },

      extendsBundlerOptions: (bundlerOptions: unknown): void => {
        // switch to modern api for vite
        addViteConfig(bundlerOptions, app, {
          css: {
            preprocessorOptions: {
              sass: {
                api: 'modern',
              },
              scss: {
                api: 'modern',
              },
            },
          },
        })
        injectScssConfigModule(bundlerOptions, app, id)
      },

      onInitialized: (): Promise<void> =>
        Promise.all([
          prepareInjectSass(app, id),

          prepareConfigSass(app, {
            id,
            defaultConfig,
            defaultPalette,
            generator,
            userConfig,
            userPalette,
          }),

          preparePaletteSass(app, {
            id,
            defaultPalette,
            generator,
            userPalette,
          }),

          prepareStyleSass(app, { id, userStyle }),
        ]).then(() => {
          if (app.env.isDebug) logger.info(`Style file for ${id} generated`)
        }),

      onWatched: (_, watchers): void => {
        const configWatcher = watch(userConfig, {
          cwd: app.dir.source(),
          ignoreInitial: true,
        })

        const updateConfig = (): Promise<void> =>
          prepareConfigSass(app, {
            id,
            defaultConfig,
            defaultPalette,
            generator,
            userConfig,
            userPalette,
          }).then(() => {
            if (app.env.isDebug) logger.info(`Style file for ${id} updated`)
          })

        configWatcher.on('add', () => {
          void updateConfig()
        })
        configWatcher.on('unlink', () => {
          void updateConfig()
        })

        watchers.push(configWatcher)

        const paletteWatcher = watch(userPalette, {
          cwd: app.dir.source(),
          ignoreInitial: true,
        })

        const updatePalette = (): Promise<void> =>
          Promise.all([
            prepareConfigSass(app, {
              id,
              defaultConfig,
              defaultPalette,
              generator,
              userConfig,
              userPalette,
            }),

            preparePaletteSass(app, {
              id,
              defaultPalette,
              generator,
              userPalette,
            }),
          ]).then(() => {
            if (app.env.isDebug) logger.info(`Style file for ${id} updated`)
          })

        paletteWatcher.on('add', () => {
          void updatePalette()
        })
        paletteWatcher.on('unlink', () => {
          void updatePalette()
        })

        watchers.push(paletteWatcher)

        if (userStyle) {
          const styleWatcher = watch(userStyle, {
            cwd: app.dir.source(),
            ignoreInitial: true,
          })

          const updateStyle = (): Promise<void> =>
            prepareStyleSass(app, { id, userStyle }).then(() => {
              if (app.env.isDebug) logger.info(`Style file for ${id} updated`)
            })

          styleWatcher.on('add', () => {
            void updateStyle()
          })
          styleWatcher.on('unlink', () => {
            void updateStyle()
          })
          watchers.push(styleWatcher)
        }
      },

      clientConfigFile: () => prepareClientConfigFile(app, id),
    }
  }
