import Document, {
    Html,
    Head,
    Main,
    NextScript,
    DocumentContext,
    DocumentInitialProps,
} from 'next/document'

import { langForPath } from '../src/locales'

type DocumentProps = DocumentInitialProps & { lang: string }

/**
 * 全站 HTML 外壳。
 * 静态导出不能靠布局改 html 的 lang，所以按每个页面的路径设置。
 */
export default class DocsiteDocument extends Document<DocumentProps> {
    static async getInitialProps(ctx: DocumentContext): Promise<DocumentProps> {
        const initialProps = await Document.getInitialProps(ctx)

        return { ...initialProps, lang: langForPath(ctx.asPath) }
    }

    render() {
        return (
            <Html lang={this.props.lang}>
                <Head />
                <body className="theme-blue">
                    <Main />
                    <NextScript />
                </body>
            </Html>
        )
    }
}
