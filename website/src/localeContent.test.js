/** @jest-environment node */

function sidebarFor(sidebars) {
    jest.resetModules()
    jest.doMock('fs', () => ({
        existsSync: () => true,
        readFileSync: () => '---\ntitle: Page\n---\n',
    }))
    jest.doMock('../meta/sidebars.json', () => sidebars)

    return require('./localeContent').sidebarForLocale
}

afterEach(() => {
    jest.resetModules()
    jest.dontMock('fs')
    jest.dontMock('../meta/sidebars.json')
})

test('keeps independent group names and page membership within the same section', () => {
    const sidebarForLocale = sidebarFor([
        {
            section: 'getting-started',
            items: [
                {
                    label: { 'zh-CN': '安装', en: 'Installation' },
                    items: [{ url: '/getting-started' }],
                },
                {
                    label: { 'zh-CN': '基础使用', en: 'Basic Usage' },
                    items: [{ url: '/getting-started/quickstart' }],
                },
            ],
        },
    ])

    for (const [locale, labels] of [
        ['zh-CN', ['安装', '基础使用']],
        ['en', ['Installation', 'Basic Usage']],
    ]) {
        const groups = sidebarForLocale(locale)[0].items

        expect(groups.map(({ label }) => label)).toEqual(labels)
        expect(groups.map(({ items }) => items.map(({ url }) => url))).toEqual([
            [`/${locale}/getting-started`],
            [`/${locale}/getting-started/quickstart`],
        ])
    }
})

test('shares one string label and trims surrounding spaces', () => {
    const sidebarForLocale = sidebarFor([
        {
            section: 'getting-started',
            items: [
                {
                    label: '  Shared group  ',
                    items: [{ url: '/getting-started' }],
                },
            ],
        },
    ])

    expect(sidebarForLocale('zh-CN')[0].items[0].label).toBe('Shared group')
    expect(sidebarForLocale('en')[0].items[0].label).toBe('Shared group')
})

test('trims a localized group name', () => {
    const sidebarForLocale = sidebarFor([
        {
            section: 'getting-started',
            items: [
                {
                    label: { 'zh-CN': '  安装  ', en: ' Installation ' },
                    items: [{ url: '/getting-started' }],
                },
            ],
        },
    ])

    expect(sidebarForLocale('zh-CN')[0].items[0].label).toBe('安装')
    expect(sidebarForLocale('en')[0].items[0].label).toBe('Installation')
})

test('reports the group when its current-language label is missing', () => {
    const sidebarForLocale = sidebarFor([
        {
            section: 'getting-started',
            items: [
                {
                    label: { 'zh-CN': '安装', en: 'Installation' },
                    items: [{ url: '/getting-started' }],
                },
                {
                    label: { 'zh-CN': '基础使用' },
                    items: [{ url: '/getting-started/quickstart' }],
                },
            ],
        },
    ])

    expect(() => sidebarForLocale('en')).toThrow(/sidebars\.json.*getting-started.*2.*en/)
})
