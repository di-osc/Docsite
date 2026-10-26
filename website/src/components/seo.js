import React from 'react'
import PropTypes from 'prop-types'
import Head from 'next/head'

import siteMetadata from '../../meta/site.json'

export default function SEO({ description, title, sectionTitle, siteTitle, slogan }) {
    const name = siteTitle || siteMetadata.company
    const pageTitle = title
        ? `${title} · ${sectionTitle || name}`
        : slogan
        ? `${name} · ${slogan}`
        : name
    const metaDescription = description || slogan || name

    return (
        <Head>
            <title>{pageTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={name} />
        </Head>
    )
}

SEO.propTypes = {
    description: PropTypes.string,
    title: PropTypes.string,
    sectionTitle: PropTypes.string,
    siteTitle: PropTypes.string,
    slogan: PropTypes.string,
}
