export interface MarkdownItCollapsedLinesOptions {
  /**
   * Whether to collapse code blocks when they exceed a certain number of lines,
   *
   * - If `number`, collapse starts from line `number`.
   * - If `true`, collapse starts from line 15 by default.
   * - If `false`, do not enable `collapsedLines` globally, but you can enable it for individual code blocks using `:collapsed-lines`
   * - If `'disable'`, Completely disable `collapsedLines`
   * @default 'disable'
   */
  collapsedLines?: boolean | number | 'disable'

  /**
   * @default false
   */
  removeLastLine?: boolean
}