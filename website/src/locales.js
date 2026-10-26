import siteConfig from '../meta/site.json'

/** 全站共用配置。语言相关字段在 locales 里，不设默认语言。 */
export const siteMetadata = siteConfig

/**
 * 返回已配置的语言 id，顺序与 site.json 一致。
 * @returns {string[]}
 */
export function localeIds() {
    return Object.keys(siteConfig.locales)
}

/**
 * 读取一种语言的配置，并带上全站共用字段。
 * 语言 id 不存在时返回 null。
 * @param {string} locale
 * @returns {object | null}
 */
export function localeConfig(locale) {
    const config = siteConfig.locales[locale]

    if (!config) {
        return null
    }

    return {
        id: locale,
        company: siteConfig.company,
        companyUrl: siteConfig.companyUrl,
        repo: siteConfig.repo,
        theme: siteConfig.theme,
        ...config,
    }
}

/**
 * 返回一种语言的界面短句。未配置时使用中文，供未传入文案的组件保持现有界面。
 * @param {string} [locale]
 * @returns {object}
 */
export function uiCopy(locale = 'zh-CN') {
    return localeConfig(locale)?.ui || localeConfig('zh-CN').ui
}

/**
 * 从 URL 路径取出语言 id。
 * 语言是地址的第一段。章节目录不能用来判断语言。
 * @param {string} pathname
 * @returns {string | null}
 */
export function localeFromPath(pathname) {
    const [segment] = String(pathname || '')
        .split('?')[0]
        .split('#')[0]
        .split('/')
        .filter(Boolean)

    return segment && siteConfig.locales[segment] ? segment : null
}

/**
 * 返回页面应使用的 HTML 语言。
 * 地址里没有语言时，选择页和 404 使用 en。
 * @param {string} pathname
 * @returns {string}
 */
export function langForPath(pathname) {
    const locale = localeFromPath(pathname)

    if (!locale) {
        return 'en'
    }

    return localeConfig(locale).lang
}

/**
 * 给站内路径加上语言前缀。
 * @param {string} locale
 * @param {string} urlPath 不带语言的路径，例如 /writing
 * @returns {string}
 */
export function withLocale(locale, urlPath) {
    const path = urlPath.startsWith('/') ? urlPath : `/${urlPath}`

    if (path === '/') {
        return `/${locale}`
    }

    return `/${locale}${path}`
}

/**
 * 去掉地址里的语言前缀，得到各语言共用的页面路径。
 * @param {string} pathname
 * @returns {string}
 */
export function stripLocale(pathname) {
    const locale = localeFromPath(pathname)

    if (!locale) {
        return pathname || '/'
    }

    const rest = pathname.split('?')[0].replace(new RegExp(`^/${locale}`), '') || '/'

    return rest.startsWith('/') ? rest : `/${rest}`
}

/**
 * 把当前地址换成另一种语言，保留语言后面的路径。
 * 目标语言没有这一页时，由调用方改去该语言的第一章。
 * @param {string} pathname
 * @param {string} nextLocale
 * @returns {string}
 */
export function swapLocale(pathname, nextLocale) {
    return withLocale(nextLocale, stripLocale(pathname))
}

/**
 * 按语言取出章节 id 到标题、主题的映射。
 * @param {string} locale
 * @returns {Record<string, {id: string, title: string, theme: string}>}
 */
export function sectionsById(locale) {
    const sections = localeConfig(locale)?.sections || []

    return Object.fromEntries(sections.map((section) => [section.id, section]))
}

/**
 * 该语言导航里的第一个站内地址，用作这一语言的第一章。
 * @param {string} locale
 * @returns {string}
 */
export function firstChapterPath(locale) {
    const navigation = localeConfig(locale)?.navigation || []
    const internal = navigation.find((item) => item.url.startsWith('/'))

    return internal?.url || `/${locale}`
}

/**
 * 页头语言切换使用的链接。
 * 未提供当前页时，每种语言都进入自己的第一章。
 * @param {string | null} [currentLocale]
 * @returns {Array<{id: string, label: string, lang: string, href: string, description: string, current: boolean, openLabel: string}>}
 */
export function languageChoices(currentLocale = null) {
    return localeIds().map((id) => {
        const config = localeConfig(id)

        return {
            id,
            label: config.label,
            lang: config.lang,
            href: firstChapterPath(id),
            description: config.description,
            current: id === currentLocale,
            openLabel: config.ui.open,
        }
    })
}

/**
 * 判断导航项是否属于当前章节。
 * 站内地址可以是 /zh-CN/writing 这种带语言前缀的形式。
 * @param {string} url
 * @param {string} section
 * @returns {boolean}
 */
export function isSectionActive(url, section) {
    if (!section || !url?.startsWith('/')) {
        return false
    }

    const parts = url.split('/').filter(Boolean)
    const sectionId = siteConfig.locales[parts[0]] ? parts[1] : parts[0]

    return sectionId === section
}
