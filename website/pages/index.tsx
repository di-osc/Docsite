import React from 'react'

import Layout from '../src/templates'
import { LandingHeader, LandingTitle, LandingGrid, LandingCard } from '../src/components/landing'
import { languageChoices, siteMetadata } from '../src/locales'

/**
 * 网站根路径只列出已配置的语言，并进入该语言的第一章。
 * 这里不是某一种语言的文档首页。
 */
export default function Home() {
    const languages = languageChoices()

    return (
        <Layout languageLinks={languages}>
            <LandingHeader>
                <LandingTitle>{siteMetadata.company}</LandingTitle>
            </LandingHeader>
            <LandingGrid cols={2} blocks>
                {languages.map((language) => (
                    <LandingCard
                        key={language.id}
                        title={language.label}
                        url={language.href}
                        button={language.openLabel}
                    >
                        {language.description}
                    </LandingCard>
                ))}
            </LandingGrid>
        </Layout>
    )
}
