import type { GetStaticPaths, GetStaticProps } from 'next'
import { serialize } from 'next-mdx-remote/serialize'
import fs from 'fs'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import path from 'path'
import Layout from '../src/templates'
import remarkPlugins from '../plugins/index.mjs'
import { remarkComponents } from '../src/remark'

import { localeConfig, localeIds, sectionsById } from '../src/locales'
import {
    assertLocaleIdsDoNotCollide,
    getDocsDirectory,
    languageLinksForPage,
    sidebarForLocale,
} from '../src/localeContent'

type ApiDetails = {
    stringName: string | null
    baseClass: {
        title: string
        slug: string
    } | null
    trainable: string | null
}

export type PropsPageBase = {
    /**
     * TODO: This is only here for legacy support of the old code base
     * It should be refactort to pass the file path and page path instead.
     */
    slug: string
    sectionTitle: string | null
    theme: string | null
    section: string
    isIndex: boolean
}

export type PropsPage = PropsPageBase & {
    mdx: MDXRemoteSerializeResult
    apiDetails: ApiDetails
}

const PostPage = ({ mdx: mdx, ...props }: PropsPage) => {
    return (
        <Layout {...props}>
            <MDXRemote {...mdx} components={remarkComponents} />
        </Layout>
    )
}

export default PostPage

type ParsedUrlQuery = {
    listPathPage: Array<string>
}

export const getStaticPaths: GetStaticPaths<ParsedUrlQuery> = async () => {
    assertLocaleIdsDoNotCollide()

    // 只扫描 docs/<语言>/。地址始终保留语言目录，不把某种语言当成无前缀的默认站。
    const loadFolder = (pathBase: Array<string>): Array<{ params: ParsedUrlQuery }> =>
        fs
            .readdirSync(path.join(getDocsDirectory(), ...pathBase), { withFileTypes: true })
            .flatMap((dirent: fs.Dirent) => {
                if (dirent.isDirectory()) {
                    return loadFolder([...pathBase, dirent.name])
                }
                if (!dirent.name.includes('.mdx') || dirent.name[0] === '_') {
                    return []
                }

                return {
                    params: {
                        listPathPage:
                            dirent.name === 'index.mdx'
                                ? pathBase
                                : [...pathBase, dirent.name.replace('.mdx', '')],
                    },
                }
            })

    const paths = localeIds().flatMap((locale) => {
        const localeDirectory = path.join(getDocsDirectory(), locale)

        return fs.existsSync(localeDirectory) ? loadFolder([locale]) : []
    })

    return {
        paths,
        fallback: false,
    }
}

const getPathFileWithExtension = (listPathFile: ReadonlyArray<string>) =>
    `${path.join(...listPathFile)}.mdx`

export const getStaticProps: GetStaticProps<PropsPage, ParsedUrlQuery> = async (args) => {
    if (!args.params) {
        return { notFound: true }
    }

    // 页面 URL 对应仓库根目录 docs/ 中的 MDX，而不是 website 内部路径
    const listPathFile = [getDocsDirectory(), ...args.params.listPathPage]
    const isIndex = fs.existsSync(getPathFileWithExtension(listPathFile)) !== true
    const listPathFileWithIndex = isIndex ? [...listPathFile, 'index'] : listPathFile
    const pathFileWithIndexAndExtension = getPathFileWithExtension(listPathFileWithIndex)

    const mdx = await serialize(fs.readFileSync(pathFileWithIndexAndExtension, 'utf-8'), {
        parseFrontmatter: true,
        mdxOptions: { remarkPlugins },
    })

    if (!mdx.frontmatter) {
        throw new Error(`Frontmatter missing for ${pathFileWithIndexAndExtension}`)
    }

    const locale = args.params.listPathPage[0]
    const localeMeta = localeConfig(locale)

    if (!localeMeta) {
        return { notFound: true }
    }

    // 父目录是章节，不是语言。docs/zh-CN/getting-started/index.mdx 的父目录是 getting-started。
    const parentFolder =
        listPathFileWithIndex.length > 2
            ? listPathFileWithIndex[listPathFileWithIndex.length - 2]
            : null
    const section = mdx.frontmatter.section ?? parentFolder
    const sectionMeta = section ? sectionsById(locale)[section] ?? null : null
    const baseClass = null
    const apiDetails: ApiDetails = {
        stringName: mdx.frontmatter.api_string_name ?? null,
        baseClass: baseClass
            ? {
                  title: mdx.frontmatter.title,
                  slug: mdx.frontmatter.api_base_class,
              }
            : null,
        trainable: mdx.frontmatter.api_trainable ?? null,
    }

    const slug = `/${args.params.listPathPage.join('/')}`
    const sectionSidebar = sidebarForLocale(locale).find((sidebar) => sidebar.section === section)
    const sidebarItems = sectionSidebar?.items ?? []
    const sidebarFlat = sidebarItems.flatMap((group) => group.items)
    const currentIndex = sidebarFlat.findIndex((item) => item.url === slug)
    const next = currentIndex >= 0 ? sidebarFlat[currentIndex + 1] : undefined

    return {
        props: {
            ...mdx.frontmatter,
            slug,
            mdx,
            locale,
            siteTitle: localeMeta.title,
            description: localeMeta.description,
            navigation: localeMeta.navigation,
            footer: localeMeta.footer,
            ui: localeMeta.ui,
            sidebar: sidebarItems,
            languageLinks: languageLinksForPage(slug, locale),
            sectionTitle: sectionMeta?.title ?? null,
            theme: sectionMeta?.theme ?? null,
            section: section,
            apiDetails: apiDetails,
            isIndex,
            next: next
                ? {
                      slug: next.url,
                      title: next.text,
                  }
                : null,
        },
    }
}
