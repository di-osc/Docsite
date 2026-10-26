import React from 'react'
import PropTypes from 'prop-types'

import ReadNext from '../components/readnext'
import Button from '../components/button'
import Grid from '../components/grid'
import Title from '../components/title'
import Footer from '../components/footer'
import Sidebar from '../components/sidebar'
import Main from '../components/main'
import { getCurrentSource, github } from '../components/util'
import { uiCopy } from '../locales'

export default function Docs({ pageContext, children }) {
    const {
        slug,
        title,
        section,
        teaser,
        source,
        tag,
        isIndex,
        next,
        menu,
        theme,
        version,
        apiDetails,
        locale,
        footer,
    } = pageContext
    const ui = pageContext.ui || uiCopy(locale || 'zh-CN')
    const sidebar = pageContext.sidebar ? { items: pageContext.sidebar } : null
    const pageMenu = menu ? menu.map(([text, id]) => ({ text, id })) : []
    const sourcePath = source ? github(source) : null

    const subFooter = (
        <div data-pagefind-ignore="">
            <Grid cols={2}>
                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                    <Button to={getCurrentSource(slug, isIndex)} icon="code">
                        {ui.suggestEdit}
                    </Button>
                </div>
                {next && <ReadNext title={next.title} to={next.slug} label={ui.readNext} />}
            </Grid>
        </div>
    )

    return (
        <>
            {sidebar && <Sidebar items={sidebar.items} pageMenu={pageMenu} slug={slug} />}
            <Main
                section={section}
                theme={theme || 'blue'}
                sidebar
                asides
                wrapContent
                pagefindLang={locale}
                footer={<Footer groups={footer} />}
            >
                <Title
                    title={title}
                    teaser={teaser}
                    source={sourcePath}
                    tag={tag}
                    version={version}
                    id="_title"
                    apiDetails={apiDetails}
                />
                {children}
                {subFooter}
            </Main>
        </>
    )
}

Docs.propTypes = {
    pageContext: PropTypes.object.isRequired,
    children: PropTypes.node,
}
