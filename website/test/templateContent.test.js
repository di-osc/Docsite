const fs = require('node:fs')
const path = require('node:path')

const siteRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(siteRoot, '..')

/**
 * 解析仓库内文件的绝对路径。
 * docs/ 位于仓库根目录，站点源码位于 website/。
 */
const resolveRepoPath = (relativePath) =>
    path.join(relativePath.startsWith('docs/') ? repoRoot : siteRoot, relativePath)

const read = (relativePath) => fs.readFileSync(resolveRepoPath(relativePath), 'utf8')
const readJson = (relativePath) => JSON.parse(read(relativePath))

/**
 * 收集 docs/<语言>/ 下的 MDX。第一级是语言，章节在下一级。
 */
const collectDocuments = (directory, relative = 'docs') =>
    fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        if (entry.name === 'superpowers') {
            return []
        }

        const next = path.join(directory, entry.name)
        const nextRelative = `${relative}/${entry.name}`

        if (entry.isDirectory()) {
            return collectDocuments(next, nextRelative)
        }

        return entry.name.endsWith('.mdx') ? [nextRelative] : []
    })

const documentationPages = collectDocuments(path.join(repoRoot, 'docs')).sort()

/**
 * 公开地址始终带语言前缀。index.mdx 对应该目录，其余文件名成为最后一段。
 */
const routeForDocument = (file) => {
    const [, locale, rest] = file.match(/^docs\/([^/]+)\/(.+)\.mdx$/)
    const pagePath = rest.endsWith('/index') ? rest.slice(0, -'/index'.length) : rest

    return `/${locale}/${pagePath}`
}

/** 侧边栏配置不带语言，只保留章节和页面路径。 */
const sidebarPathForDocument = (file) => {
    const route = routeForDocument(file)
    const [, , ...rest] = route.split('/')

    return `/${rest.join('/')}`
}

const frontmatterForDocument = (file) => {
    const match = read(file).match(/^---\n([\s\S]*?)\n---/)
    if (!match) {
        return null
    }

    return Object.fromEntries(
        ['title', 'teaser', 'section'].map((field) => [
            field,
            match[1].match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1],
        ])
    )
}

const sidebarLinks = (sidebars) =>
    sidebars.flatMap((sidebar) =>
        sidebar.items.flatMap((group) =>
            group.items.map((item) => ({ ...item, section: sidebar.section }))
        )
    )

const sectionByAnchor = (content, anchor) =>
    content.match(
        new RegExp(`^## .+ \\{id="${anchor}"\\}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm')
    )?.[1] ?? ''

describe('documentation template content', () => {
    test('keeps locales, top navigation, and the shared sidebar connected', () => {
        const site = readJson('meta/site.json')
        const sidebars = readJson('meta/sidebars.json')
        const sectionIds = sidebars.map((sidebar) => sidebar.section)

        expect(site.defaultLocale).toBeUndefined()
        expect(Object.keys(site.locales).length).toBeGreaterThan(1)
        expect(new Set(sectionIds).size).toBe(sectionIds.length)

        for (const [locale, config] of Object.entries(site.locales)) {
            const localeSectionIds = config.sections.map((section) => section.id)

            expect(localeSectionIds.sort()).toEqual([...sectionIds].sort())
            expect(localeSectionIds.some((id) => site.locales[id])).toBe(false)
            for (const item of config.navigation.filter((item) => item.url.startsWith('/'))) {
                expect(item.url.startsWith(`/${locale}/`)).toBe(true)
                expect(localeSectionIds).toContain(item.url.split('/')[2])
            }
        }
    })

    test('all documentation pages have complete frontmatter and a sidebar entry', () => {
        const sidebars = readJson('meta/sidebars.json')
        const links = sidebarLinks(sidebars)

        for (const file of documentationPages) {
            const [, , section] = file.split('/')
            const frontmatter = frontmatterForDocument(file)

            expect(frontmatter).not.toBeNull()
            expect(frontmatter?.title).toBeTruthy()
            expect(frontmatter?.teaser).toBeTruthy()
            expect(frontmatter?.section).toBe(section)
            expect(links).toContainEqual(
                expect.objectContaining({ section, url: sidebarPathForDocument(file) })
            )
            expect(routeForDocument(file).split('/')[1]).toBe(file.split('/')[1])
        }
    })

    test('shared sidebar links stay unprefixed and exist in every language', () => {
        const site = readJson('meta/site.json')
        const links = sidebarLinks(readJson('meta/sidebars.json'))

        for (const link of links) {
            expect(link.url.split('/')[1]).toBe(link.section)
        }

        for (const locale of Object.keys(site.locales)) {
            const routes = new Set(
                documentationPages
                    .filter((file) => file.startsWith(`docs/${locale}/`))
                    .map(sidebarPathForDocument)
            )

            for (const link of links) {
                expect(routes).toContain(link.url)
            }
        }
    })

    test('right-side menu entries point to explicit heading anchors', () => {
        for (const file of documentationPages) {
            const content = read(file)
            const frontmatter = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
            const menuIds = [...frontmatter.matchAll(/\['[^']+',\s*'([^']+)'\]/g)].map(
                (match) => match[1]
            )

            for (const id of menuIds) {
                expect(content).toContain(`{id="${id}"}`)
            }
        }
    })

    test('bundled component examples pair source code with a live result', () => {
        const guidePath = 'docs/zh-CN/writing/mdx-components.mdx'
        if (!fs.existsSync(resolveRepoPath(guidePath))) return

        const guide = read(guidePath)
        const examples = [
            ['infobox', '<Infobox'],
            ['button', '<Button'],
            ['accordion', '<Accordion'],
            ['grid', '<Grid'],
            ['aside', '<Aside'],
            ['tag', '<Tag'],
            ['type-annotations', '~~AcmeClient~~'],
        ]

        for (const [anchor, sourceToken] of examples) {
            const section = sectionByAnchor(guide, anchor)
            expect(section).toContain('实际效果')
            expect(section.split(sourceToken).length).toBeGreaterThanOrEqual(3)
        }
    })

    test('bundled asset examples only render files that exist in public', () => {
        const guidePath = 'docs/zh-CN/writing/assets.mdx'
        if (!fs.existsSync(resolveRepoPath(guidePath))) return

        const guideWithoutCode = read(guidePath).replace(/```[\s\S]*?```/g, '')
        const imagePaths = [...guideWithoutCode.matchAll(/!\[[^\]]*]\((\/[^)]+)\)/g)].map(
            (match) => match[1]
        )

        expect(imagePaths.length).toBeGreaterThan(0)
        for (const imagePath of imagePaths) {
            expect(fs.existsSync(path.join(siteRoot, 'public', imagePath.replace(/^\//, '')))).toBe(
                true
            )
        }
    })

    test('prefixes root public metadata with the configured deployment path', () => {
        const app = read('pages/_app.tsx')

        expect(app).toContain("withBasePath('/sitemap.xml')")
        expect(app).toContain("withBasePath('/manifest.webmanifest')")
        expect(app).toContain('content={site.theme}')
        expect(read('pages/_document.tsx')).toContain('lang={this.props.lang}')
        expect(read('pages/_document.tsx')).toContain('langForPath')
        expect(readJson('meta/site.json').locales['zh-CN'].lang).toBe('zh-CN')
        expect(read('src/components/embed.js')).toContain('withBasePathForUrl(src)')
    })

    test('configures static builds and the web manifest for subpath hosting', () => {
        const nextConfig = read('next.config.mjs')
        const manifest = readJson('public/manifest.webmanifest')

        expect(nextConfig).toContain(
            'basePath: normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH)'
        )
        expect(manifest.scope).toBe('.')
        expect(manifest.start_url).toBe('.')
    })

    test('ships a GitHub Pages workflow with build metadata and deployment permissions', () => {
        const workflow = read('../.github/workflows/deploy-pages.yml')

        expect(workflow).toContain('branches: [main]')
        expect(workflow).toContain('workflow_dispatch:')
        expect(workflow).not.toContain('types: [published]')
        expect(workflow).toContain('pages: write')
        expect(workflow).toContain('id-token: write')
        expect(workflow).toContain('uses: actions/configure-pages@v5')
        expect(workflow).toContain('NEXT_PUBLIC_BASE_PATH: ${{ steps.pages.outputs.base_path }}')
        expect(workflow).toContain('SITE_URL: ${{ steps.pages.outputs.base_url }}')
        expect(workflow).toContain('uses: actions/upload-pages-artifact@v4')
        expect(workflow).toContain('path: website/out')
        expect(workflow).toContain('needs: build')
        expect(workflow).toContain('name: github-pages')
        expect(workflow).toContain('uses: actions/deploy-pages@v4')
    })
})
