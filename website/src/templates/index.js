import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Navigation from '../components/navigation'
import Progress from '../components/progress'
import Search from '../components/search'
import Footer from '../components/footer'
import SEO from '../components/seo'
import Docs from './docs'
import siteMetadata from '../../meta/site.json'
import { languageChoices, localeConfig } from '../locales'

export default function Layout({ children, ...pageContext }) {
    const { title, section, sectionTitle, teaser, theme, searchExclude, locale, footer } =
        pageContext
    const config = locale ? localeConfig(locale) : null
    const languages = pageContext.languageLinks || languageChoices(locale)
    const bodyClass = classNames(`theme-${theme || 'blue'}`, {
        'search-exclude': Boolean(searchExclude),
    })

    // 文档页之间的客户端跳转不会重绘 html。这里把语言补到文档元素上。
    useEffect(() => {
        if (config?.lang) {
            document.documentElement.lang = config.lang
        }
    }, [config?.lang])

    return (
        <div className={bodyClass}>
            <SEO
                title={title}
                description={teaser || config?.description}
                sectionTitle={sectionTitle}
                siteTitle={config?.title}
                slogan={config?.slogan}
            />
            <Navigation
                title={config?.title || siteMetadata.company}
                items={config?.navigation || []}
                section={section}
                languages={languages}
            >
                <>
                    <Search locale={locale} copy={config?.ui} />
                    <Progress />
                </>
            </Navigation>
            {section ? (
                <Docs pageContext={pageContext}>{children}</Docs>
            ) : (
                <>
                    {children}
                    <Footer wide groups={footer} />
                </>
            )}
        </div>
    )
}

Layout.propTypes = {
    children: PropTypes.node,
}
