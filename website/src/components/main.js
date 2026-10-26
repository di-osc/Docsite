import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import patternBlue from '../images/pattern_blue.png'
import classes from '../styles/main.module.sass'

const patterns = {
    blue: patternBlue,
}

export const Content = ({ Component = 'div', className, children, ...props }) => (
    <Component className={classNames(classes.content, className)} {...props}>
        {children}
    </Component>
)

export default function Main({
    sidebar = false,
    asides = false,
    wrapContent = false,
    theme,
    footer,
    pagefindLang,
    children,
}) {
    const pattern = patterns[theme ?? 'blue']
    const mainClassNames = classNames(classes.root, {
        [classes['with-sidebar']]: sidebar,
        [classes['with-asides']]: asides,
    })
    // Pagefind 用这个属性把正文划进当前语言，搜索时只返回这一语言。
    const pagefindProps = { 'data-pagefind-body': '' }

    if (pagefindLang) {
        pagefindProps['data-pagefind-filter'] = `lang:${pagefindLang}`
    }

    return (
        <main className={mainClassNames}>
            {wrapContent ? (
                <Content Component="article" {...pagefindProps}>
                    {children}
                </Content>
            ) : (
                children
            )}
            {asides && (
                <div className={classes.asides} style={{ backgroundImage: `url(${pattern.src}` }} />
            )}
            {footer}
        </main>
    )
}

Main.propTypes = {
    sidebar: PropTypes.bool,
    asides: PropTypes.bool,
    wrapContent: PropTypes.bool,
    theme: PropTypes.string,
    footer: PropTypes.node,
    pagefindLang: PropTypes.string,
}
