import React from 'react'

import Layout from '../src/templates'
import { LandingHeader, LandingTitle, LandingSubtitle } from '../src/components/landing'
import Button from '../src/components/button'
import { languageChoices, localeConfig } from '../src/locales'

/**
 * 静态 404 不知道用户原来的语言，所以每种语言的返回链接都放出来。
 */
export default function Page404() {
    const languages = languageChoices()

    return (
        <Layout title="404" searchExclude languageLinks={languages}>
            <LandingHeader style={{ minHeight: 400 }}>
                <LandingTitle>404</LandingTitle>
                {languages.map((language) => {
                    const copy = localeConfig(language.id).ui

                    return (
                        <div key={language.id}>
                            <LandingSubtitle>
                                {language.label}：{copy.notFoundBody}
                            </LandingSubtitle>
                            <Button to={language.href} variant="tertiary" large>
                                {copy.backHome}
                            </Button>
                        </div>
                    )
                })}
            </LandingHeader>
        </Layout>
    )
}
