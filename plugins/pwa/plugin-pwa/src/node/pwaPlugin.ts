import {
  addViteOptimizeDepsExclude,
  addViteSsrNoExternal,
  customizeDevServer,
} from '@vuepress/helper'
import type { PluginFunction } from 'vuepress/core'
import { generateManifest } from './generateManifest.js'
import { generateServiceWorker } from './generateServiceWorker.js'
import { getManifest } from './getManifest.js'
import { appendBase } from './helper.js'
import { injectLinksToHead } from './injectLinksToHead.js'
import { PLUGIN_NAME, logger } from './logger.js'
import type { PwaPluginOptions } from './options.js'
import { prepareClientConfigFile } from './prepareClientConfigFile.js'

export const pwaPlugin =
  (options: PwaPluginOptions = {}): PluginFunction =>
  (app) => {
    if (app.env.isDebug) logger.info('Options:', options)

    const { base, shouldPrefetch = true } = app.options

    if (options.appendBase) appendBase(base, options)

    if (shouldPrefetch === true)
      logger.warn(
        'The plugin will register service worker to handle assets, so we recommend you to set "shouldPrefetch: false" in VuePress config file.',
      )

    app.options.head = injectLinksToHead(options, base, app.options.head)

    return {
      name: PLUGIN_NAME,

      extendsBundlerOptions: (bundlerOptions: unknown): void => {
        addViteOptimizeDepsExclude(bundlerOptions, app, [
          'mitt',
          'register-service-worker',
        ])
        addViteSsrNoExternal(bundlerOptions, app, '@vuepress/helper')

        customizeDevServer(bundlerOptions, app, {
          path: '/manifest.webmanifest',
          response: async (_, response) => {
            response.setHeader('Content-Type', 'application/manifest+json')

            return JSON.stringify(await getManifest(app, options))
          },
          errMsg: 'Unexpected manifest generation error',
        })
      },

      onGenerated: async (): Promise<void> => {
        await generateManifest(app, options)
        await generateServiceWorker(app, options)
      },

      clientConfigFile: () => prepareClientConfigFile(app, options),
    }
  }
