import fs from 'fs'
import path from 'path'

import sidebars from '../meta/sidebars.json'
import { localeIds, stripLocale, swapLocale, withLocale, localeConfig } from './locales'

/**
 * 返回仓库根目录下的文档目录。
 * Next 的工作目录是 website，文档与它同级。
 * @returns {string}
 */
export function getDocsDirectory() {
    return path.resolve(process.cwd(), '..', 'docs')
}

/**
 * 语言 id 不能和章节 id 重名，否则地址第一段无法区分语言和章节。
 * 冲突时抛出错误，让构建停在配置上。
 */
export function assertLocaleIdsDoNotCollide() {
    const sectionIds = new Set(sidebars.map((sidebar) => sidebar.section))

    for (const locale of localeIds()) {
        if (sectionIds.has(locale)) {
            throw new Error(`Locale id "${locale}" collides with a section id`)
        }

        for (const section of localeConfig(locale).sections) {
            if (localeIds().includes(section.id)) {
                throw new Error(`Section id "${section.id}" collides with a locale id`)
            }
        }
    }
}

/**
 * 找到一种语言下某个站内路径对应的 MDX 文件。
 * 先找页面文件，再找该目录的 index。
 * @param {string} locale
 * @param {string} urlPath 不带语言前缀的路径
 * @returns {string | null}
 */
export function resolvePageFile(locale, urlPath) {
    const relative = String(urlPath || '').replace(/^\//, '')

    if (!relative || relative.split('/').includes('..')) {
        return null
    }

    const base = path.join(getDocsDirectory(), locale, relative)
    const page = `${base}.mdx`
    const index = path.join(base, 'index.mdx')

    if (fs.existsSync(page)) {
        return page
    }

    if (fs.existsSync(index)) {
        return index
    }

    return null
}

/**
 * 读取 MDX frontmatter 里的 title，用作该语言侧边栏上的页面名称。
 * @param {string} file
 * @returns {string | null}
 */
function readPageTitle(file) {
    const source = fs.readFileSync(file, 'utf8')
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1]
    const title = frontmatter?.match(/^title:\s*(.+)$/m)?.[1]?.trim()

    if (!title) {
        return null
    }

    return title.replace(/^["']|["']$/g, '')
}

function groupLabel(label, locale, section, index) {
    const raw = typeof label === 'string' ? label : label?.[locale]
    const value = typeof raw === 'string' ? raw.trim() : ''

    if (!value) {
        throw new Error(
            `meta/sidebars.json: section "${section}", group ${
                index + 1
            }: label for "${locale}" must be a non-empty string`
        )
    }

    return value
}

/**
 * 按当前语言生成侧边栏。
 * 分组标题来自各组的 label，可用字符串或按语言配置的对象。
 * 页面名称来自该语言 MDX 的 title。没有译文的页面不放进这一语言。
 * url 一律加上当前语言。
 * @param {string} locale
 * @returns {Array<{section: string, items: Array<{label: string, items: Array<{text: string, url: string}>}>}>}
 */
export function sidebarForLocale(locale) {
    return sidebars
        .map((sidebar) => ({
            section: sidebar.section,
            items: sidebar.items
                .map((group, index) => ({
                    label: groupLabel(group.label, locale, sidebar.section, index),
                    items: group.items.flatMap((item) => {
                        const file = resolvePageFile(locale, item.url)

                        if (!file) {
                            return []
                        }

                        return [
                            {
                                text: readPageTitle(file) || item.text,
                                url: withLocale(locale, item.url),
                            },
                        ]
                    }),
                }))
                .filter((group) => group.items.length > 0),
        }))
        .filter((sidebar) => sidebar.items.length > 0)
}

/**
 * 当前页在另一种语言下的地址。
 * 该页没有译文时，进入那种语言导航里的第一章。
 * @param {string} pathname 带语言前缀的当前地址
 * @param {string} nextLocale
 * @returns {string}
 */
export function alternateUrl(pathname, nextLocale) {
    const relative = stripLocale(pathname)

    if (relative !== '/' && resolvePageFile(nextLocale, relative)) {
        return swapLocale(pathname, nextLocale)
    }

    const first = sidebarForLocale(nextLocale).flatMap((sidebar) =>
        sidebar.items.flatMap((group) => group.items)
    )[0]

    return first?.url || `/${nextLocale}`
}

/**
 * 页头切换：当前语言留在本页，其他语言链到译文或该语言第一章。
 * @param {string} pathname
 * @param {string} currentLocale
 * @returns {Array<{id: string, label: string, lang: string, href: string, current: boolean}>}
 */
export function languageLinksForPage(pathname, currentLocale) {
    return localeIds().map((id) => {
        const config = localeConfig(id)

        return {
            id,
            label: config.label,
            lang: config.lang,
            href: id === currentLocale ? pathname : alternateUrl(pathname, id),
            description: config.description,
            current: id === currentLocale,
            openLabel: config.ui.open,
        }
    })
}
