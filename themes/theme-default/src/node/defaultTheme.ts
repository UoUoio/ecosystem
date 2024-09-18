import {
  addViteConfig,
  addViteOptimizeDepsExclude,
  chainWebpack,
} from '@vuepress/helper'
import { activeHeaderLinksPlugin } from '@vuepress/plugin-active-header-links'
import { backToTopPlugin } from '@vuepress/plugin-back-to-top'
import { copyCodePlugin } from '@vuepress/plugin-copy-code'
import { gitPlugin } from '@vuepress/plugin-git'
import { linksCheckPlugin } from '@vuepress/plugin-links-check'
import { markdownContainerPlugin } from '@vuepress/plugin-markdown-container'
import { markdownHintPlugin } from '@vuepress/plugin-markdown-hint'
import { mediumZoomPlugin } from '@vuepress/plugin-medium-zoom'
import { nprogressPlugin } from '@vuepress/plugin-nprogress'
import { palettePlugin } from '@vuepress/plugin-palette'
import { prismjsPlugin } from '@vuepress/plugin-prismjs'
import { seoPlugin } from '@vuepress/plugin-seo'
import { sitemapPlugin } from '@vuepress/plugin-sitemap'
import { themeDataPlugin } from '@vuepress/plugin-theme-data'
import type { Page, Theme } from 'vuepress/core'
import { isPlainObject } from 'vuepress/shared'
import { fs, getDirname, path } from 'vuepress/utils'
import type {
  DefaultThemeLocaleOptions,
  DefaultThemePageData,
  DefaultThemePluginsOptions,
} from '../shared/index.js'
import {
  assignDefaultLocaleOptions,
  resolveMarkdownHintLocales,
} from './utils/index.js'

const __dirname = getDirname(import.meta.url)

export interface DefaultThemeOptions extends DefaultThemeLocaleOptions {
  /**
   * deployed hostname
   */
  hostname?: string

  /**
   * To avoid confusion with the root `plugins` option,
   * we use `themePlugins`
   */
  themePlugins?: DefaultThemePluginsOptions
}

export const defaultTheme = ({
  hostname,
  themePlugins = {},
  ...localeOptions
}: DefaultThemeOptions = {}): Theme => {
  assignDefaultLocaleOptions(localeOptions)

  return {
    name: '@vuepress/theme-default',

    templateBuild: path.resolve(__dirname, '../../templates/build.html'),

    alias: {
      // use alias to make all components replaceable
      ...Object.fromEntries(
        fs
          .readdirSync(path.resolve(__dirname, '../client/components'))
          .filter((file) => file.endsWith('.vue'))
          .map((file) => [
            `@theme/${file}`,
            path.resolve(__dirname, '../client/components', file),
          ]),
      ),
      // use alias to make all composables replaceable
      ...Object.fromEntries(
        fs
          .readdirSync(path.resolve(__dirname, '../client/composables'))
          .filter((file) => file.endsWith('.js'))
          .map((file) => [
            `@theme/${file.substring(0, file.length - 3)}`,
            path.resolve(__dirname, '../client/composables', file),
          ]),
      ),
    },

    clientConfigFile: path.resolve(__dirname, '../client/config.js'),

    extendsBundlerOptions: (bundlerOptions, app) => {
      // FIXME: hide sass deprecation warning for mixed-decls
      addViteConfig(bundlerOptions, app, {
        css: {
          preprocessorOptions: {
            sass: {
              silenceDeprecations: ['mixed-decls'],
            },
            scss: {
              silenceDeprecations: ['mixed-decls'],
            },
          },
        },
      })
      chainWebpack(bundlerOptions, app, (config) => {
        config.module
          .rule('scss')
          .use('sass-loader')
          .tap((options) => ({
            ...options,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            sassOptions: {
              silenceDeprecations: ['mixed-decls'],
              ...options.sassOptions,
            },
          }))
      })

      // ensure theme alias is not optimized by Vite
      addViteOptimizeDepsExclude(bundlerOptions, app, '@theme')
    },

    extendsPage: (page: Page<Partial<DefaultThemePageData>>) => {
      // save relative file path into page data to generate edit link
      page.data.filePathRelative = page.filePathRelative
      // save title into route meta to generate navbar and sidebar
      page.routeMeta.title = page.title
    },

    plugins: [
      // @vuepress/plugin-active-header-link
      themePlugins.activeHeaderLinks !== false
        ? activeHeaderLinksPlugin({
            headerLinkSelector: 'a.vp-sidebar-item',
            headerAnchorSelector: '.header-anchor',
            // should greater than page transition duration
            delay: 300,
          })
        : [],

      // @vuepress/plugin-back-to-top
      themePlugins.backToTop !== false
        ? backToTopPlugin(
            isPlainObject(themePlugins.backToTop) ? themePlugins.backToTop : {},
          )
        : [],

      // @vuepress/plugin-copy-code
      themePlugins.copyCode !== false
        ? copyCodePlugin({
            ...(isPlainObject(themePlugins.copyCode)
              ? themePlugins.copyCode
              : {}),
          })
        : [],

      // @vuepress/plugin-markdown-container
      themePlugins.hint !== false
        ? markdownHintPlugin({
            locales: resolveMarkdownHintLocales(localeOptions),
            ...(isPlainObject(themePlugins.hint) ? themePlugins.hint : {}),
          })
        : [],

      themePlugins.container?.codeGroup !== false
        ? markdownContainerPlugin({
            type: 'code-group',
            before: () => `<CodeGroup>\n`,
            after: () => '</CodeGroup>\n',
          })
        : [],
      themePlugins.container?.codeGroupItem !== false
        ? markdownContainerPlugin({
            type: 'code-group-item',
            before: (info) => `<CodeGroupItem title="${info}">\n`,
            after: () => '</CodeGroupItem>\n',
          })
        : [],

      // @vuepress/plugin-git
      themePlugins.git !== false
        ? gitPlugin({
            createdTime: false,
            updatedTime: localeOptions.lastUpdated !== false,
            contributors: localeOptions.contributors !== false,
          })
        : [],

      // @vuepress/plugin-links-check
      themePlugins.linksCheck !== false
        ? linksCheckPlugin(
            isPlainObject(themePlugins.linksCheck)
              ? themePlugins.linksCheck
              : {},
          )
        : [],

      // @vuepress/plugin-medium-zoom
      themePlugins.mediumZoom !== false
        ? mediumZoomPlugin({
            // should greater than page transition duration
            delay: 300,
          })
        : [],

      // @vuepress/plugin-nprogress
      themePlugins.nprogress !== false ? nprogressPlugin() : [],

      // @vuepress/plugin-palette
      palettePlugin({ preset: 'sass' }),

      // @vuepress/plugin-prismjs
      themePlugins.prismjs !== false
        ? prismjsPlugin(
            isPlainObject(themePlugins.prismjs) ? themePlugins.prismjs : {},
          )
        : [],

      // @vuepress/plugin-seo
      hostname && themePlugins.seo !== false
        ? seoPlugin({
            hostname,
            ...(isPlainObject(themePlugins.seo) ? themePlugins.seo : {}),
          })
        : [],

      // @vuepress/plugin-sitemap
      hostname && themePlugins.sitemap !== false
        ? sitemapPlugin({
            hostname,
            ...(isPlainObject(themePlugins.sitemap)
              ? themePlugins.sitemap
              : {}),
          })
        : [],

      // @vuepress/plugin-theme-data
      themeDataPlugin({ themeData: localeOptions }),
    ],
  }
}
