import React from 'react'
import PropTypes from 'prop-types'

import Icon from './icon'
import Link from './link'
import { Label } from './typography'

import classes from '../styles/readnext.module.sass'

export default function ReadNext({ title, to, label = '下一篇' }) {
    return (
        <Link to={to} noLinkLayout className={classes.root}>
            <span>
                <Label>{label}</Label>
                {title}
            </span>
            <span className={classes.icon}>
                <Icon name="arrowright" aria-hidden="true" />
            </span>
        </Link>
    )
}

ReadNext.propTypes = {
    title: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    label: PropTypes.string,
}
