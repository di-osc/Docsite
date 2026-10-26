import React from 'react'
import classNames from 'classnames'
import { useRouter } from 'next/router'
import CUSTOM_TYPES from '../../meta/type-annotations.json'
import Link from './link'
import { localeFromPath, swapLocale } from '../locales'
import classes from '../styles/code.module.sass'

/**
 * 映射里的地址带语言前缀时，改成当前页面的语言。
 * 两种语言的参考页使用同一条路径。
 */
function localizeTypeUrl(url, pathname) {
    const current = localeFromPath(pathname || '')
    const target = localeFromPath(url || '')

    if (!current || !target || current === target) {
        return url
    }

    const hashIndex = url.indexOf('#')
    const path = hashIndex === -1 ? url : url.slice(0, hashIndex)
    const hash = hashIndex === -1 ? '' : url.slice(hashIndex)

    return `${swapLocale(path, current)}${hash}`
}

export const WRAP_THRESHOLD = 30

const specialCharacterList = ['[', ']', ',', ', ']

const highlight = (element, key) =>
    specialCharacterList.includes(element) ? (
        <span className={classes['cli-arg-subtle']} key={key}>
            {element}
        </span>
    ) : (
        element
    )

function linkType(el, showLink = true, key, pathname) {
    if (!el.length) return el
    const elStr = el.trim()
    if (!elStr) return el
    const typeUrl = CUSTOM_TYPES[elStr]
    const url = typeUrl == true ? DEFAULT_TYPE_URL : localizeTypeUrl(typeUrl, pathname)
    return url && showLink ? (
        <Link to={url} hideIcon key={key}>
            {elStr}
        </Link>
    ) : (
        highlight(el, key)
    )
}

export const TypeAnnotation = ({ lang = 'python', link = true, children }) => {
    const { asPath } = useRouter()
    const code = Array.isArray(children) ? children.join('') : children || ''
    const [rawText, meta] = code.split(/(?= \(.+\)$)/)
    const annotClassNames = classNames(
        'type-annotation',
        `language-${lang}`,
        classes['inline-code'],
        classes['type-annotation'],
        {
            [classes['wrap']]: code.length >= WRAP_THRESHOLD,
        }
    )
    return (
        <span className={annotClassNames} role="code" aria-label="Type annotation">
            {rawText.split(/(\[|\]|,)/).map((el, i) => linkType(el, !!link, i, asPath))}
            {meta && <span className={classes['type-annotation-meta']}>{meta}</span>}
        </span>
    )
}
