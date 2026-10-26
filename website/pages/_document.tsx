import { Html, Head, Main, NextScript } from 'next/document'

import site from '../meta/site.json'

/**
 * 全站 HTML 外壳。
 * 页面语言来自站点配置，应与文档正文使用同一种语言。
 */
export default function Document() {
    return (
        <Html lang={site.lang}>
            <Head />
            <body className="theme-blue">
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
