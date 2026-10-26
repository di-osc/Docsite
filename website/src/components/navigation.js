import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Link from './link'
import Dropdown from './dropdown'
import classes from '../styles/navigation.module.sass'
import siteMetadata from '../../meta/site.json'
import { isSectionActive } from '../locales'

const NavigationDropdown = ({ items = [], section }) => {
    const active = items.find(({ url }) => isSectionActive(url, section))
    return (
        <Dropdown
            key={active?.url || 'title'}
            defaultValue={active?.url || 'title'}
            className={classes.dropdown}
        >
            <option value="title" disabled>
                Docs
            </option>
            {items.map(({ text, url }) => (
                <option key={url} value={url}>
                    {text}
                </option>
            ))}
        </Dropdown>
    )
}

const LanguageDropdown = ({ languages }) => {
    const current = languages.find((language) => language.current)

    return (
        <Dropdown
            key={current?.id || 'language'}
            defaultValue={current?.href || 'language'}
            className={classes['language-dropdown']}
            aria-label="Language"
        >
            {!current && (
                <option value="language" disabled>
                    Language
                </option>
            )}
            {languages.map(({ id, label, lang, href }) => (
                <option key={id} value={href} lang={lang}>
                    {label}
                </option>
            ))}
        </Dropdown>
    )
}

export default function Navigation({ title, items = [], section, languages = [], children }) {
    return (
        <nav className={classes.root}>
            <Link to="/" aria-label={title} noLinkLayout>
                <span className={classes.title}>
                    <span className={classes['title-name']}>{siteMetadata.company}</span>
                    <span className={classes['title-divider']} aria-hidden="true" />
                    <span className={classes['title-product']}>docs</span>
                </span>
            </Link>
            <div className={classes.menu}>
                <NavigationDropdown items={items} section={section} />
                <ul className={classes.list}>
                    {items.map(({ text, url }) => {
                        const isActive = isSectionActive(url, section)
                        return (
                            <li
                                key={url}
                                className={classNames(classes.item, {
                                    [classes['is-active']]: isActive,
                                })}
                            >
                                <Link to={url} tabIndex={isActive ? '-1' : null} noLinkLayout>
                                    {text}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </div>
            {languages.length > 0 && <LanguageDropdown languages={languages} />}
            {children}
        </nav>
    )
}

Navigation.propTypes = {
    title: PropTypes.string.isRequired,
    items: PropTypes.array,
    section: PropTypes.string,
    languages: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            lang: PropTypes.string,
            href: PropTypes.string.isRequired,
            current: PropTypes.bool,
        })
    ),
    children: PropTypes.node,
}
