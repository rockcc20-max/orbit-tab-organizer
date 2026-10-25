# Dotdash 隐私说明 / Privacy Notice

适用版本 / Version: 0.8.0。更新日期 / Updated: 2026-10-25。

Dotdash 原名 Orbit。本次品牌更新仅更换产品名称与视觉标识，没有扩大权限或改变数据处理方式。现有扩展的偏好存储键保持兼容。英文说明见本文下半部分。

## 本地处理的信息

Dotdash 通过 Chrome 扩展接口读取当前可访问的普通浏览器窗口及其中的标签页，包括标题、网址、标签页与窗口标识、最近访问时间，以及活动、固定、播放声音、加载、休眠、窗口显示状态等信息。这些信息仅用于在本机汇总网站、搜索与排序、切换页面和识别重复项。

总览页打开时，相关信息保存在页面运行内存中，并随标签页与窗口变化更新。Dotdash 不读取网页正文、表单输入、密码、Cookie 或完整历史记录数据库，也不在网页中注入内容脚本。

## 网络与第三方

Dotdash 没有账号系统、后端服务器、广告、分析统计或遥测服务，不将标签页标题、网址、搜索内容或窗口信息发送给开发者或第三方服务。

网站图标通过 Chrome 自身的 favicon 接口获取；Dotdash 不调用第三方图标服务。脚本、样式和后备图标随扩展提供，不从 CDN 加载。浏览器自身以及用户访问的网站可能有独立的网络行为与隐私政策，不属于 Dotdash 的控制范围。

## 权限说明

- `tabs`：读取标签页的标题、网址等信息，支持网站汇总、搜索与重复判断；按用户操作切换或关闭标签页。
- `favicon`：通过 Chrome 的图标接口显示对应网站的 Logo。

当前版本未声明额外的网站访问权限、历史记录权限或内容脚本。是否可访问无痕窗口等范围，由 Chrome 的扩展设置决定；重复清理不会将普通与无痕标签页互相判重。

自 0.6.2 起不再申请 `storage` 权限，也不再写入旧版本的默认设置或空快照数组；外观偏好通过页面本地存储保存，不需要该扩展权限。

## 用户控制

未设置手动偏好时，外观跟随浏览器的浅色／深色设置，并显示对应的太阳／月亮图标。点击图标直接切换明暗后，Dotdash 仅在本机页面的 `localStorage` 中保存 `orbitTheme` 外观设置，用于下次打开时恢复，并在同一扩展的总览页之间同步；不上传或保存浏览内容。

界面语言默认根据浏览器语言在中文、英文、韩文和日文中选择，并直接显示语言名称；不支持的语言回退为英文。下拉只显示四种语言，手动选择保存在本机 `localStorage` 的 `orbitLanguage` 设置中，用于下次恢复。翻译文本随扩展打包，不发送页面内容给翻译服务。手动同步只重新读取本机当前标签页，不是云端同步。

读取和展示标签页不会自动关闭页面。批量关闭重复项需用户选择并确认，执行前会重新检查页面状态；每行关闭按钮则按用户点击直接关闭对应页面。关闭前请注意未保存的内容。

搜索文字和本次选择不会被 Dotdash 持久化。关闭总览页会结束该页的运行内存；卸载扩展可移除其本地扩展存储。当前版本没有云端数据或需要申请删除的服务器记录。`orbitTheme` 和 `orbitLanguage` 为原品牌时期的内部键名，保留它们是为了兼容升级前的偏好，而非新增存储内容。

## 数据使用限制

Dotdash 对通过 Chrome 扩展接口获取的信息的使用遵守 [Chrome Web Store 用户数据政策](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)，包括 [Limited Use 要求](https://developer.chrome.com/docs/webstore/program-policies/limited-use)。相关信息仅用于已披露的本地标签页整理功能，不出售、不用于广告、信用评估或借贷，也不向开发者或第三方提供查看浏览内容的渠道。

## 反馈

可通过[项目仓库的 Issue](https://github.com/rockcc20-max/orbit-tab-organizer/issues) 反馈隐私问题。公开提交截图、日志或复现示例前，请移除个人信息、私人网址、访问令牌以及不希望公开的标签页内容。

## English

Dotdash was previously called Orbit. Version 0.8.0 changes the product name and visual identity without adding permissions or changing how data is handled. The existing local preference keys are retained for upgrade compatibility.

### Information processed locally

Dotdash uses Chrome's extension interfaces to read currently accessible normal browser windows and their tabs. This includes tab titles, URLs, tab and window identifiers, recent-access information, and state such as active, pinned, audible, loading, discarded, and window display state. This information is used only on the device to group tabs by website, search and sort them, return to a page, and identify duplicate URLs.

While the overview is open, the information is held in that page's runtime memory and updated when tabs or windows change. Dotdash does not read page bodies, form inputs, passwords, cookies, or the full browsing-history database. It does not inject content scripts into websites.

### Network activity and third parties

Dotdash has no account system, backend server, advertisements, analytics, or telemetry service. It does not send tab titles, URLs, search text, or window information to the developer or third-party services.

Website icons are obtained through Chrome's own favicon interface; Dotdash does not use a third-party icon service. Scripts, styles, translations, and fallback icons are bundled with the extension rather than loaded from a CDN. Chrome itself and websites you visit may have separate network activity and privacy policies outside Dotdash's control.

### Permissions

- `tabs`: reads tab information such as titles and URLs to provide the website overview, search, and duplicate detection, and supports switching or closing tabs at the user's request.
- `favicon`: displays website icons using Chrome's favicon interface.

The current version requests no additional website access or browsing-history permission and has no content scripts. Chrome's extension settings determine whether contexts such as incognito windows are accessible. Duplicate cleanup does not compare normal and incognito tabs with each other. The unused `storage` extension permission was removed in version 0.6.2; the extension no longer writes the older default settings or empty snapshot arrays.

### Your controls and retention

Without a saved manual choice, appearance follows the browser's light or dark preference. Clicking the sun or moon button changes the appearance and saves only the `orbitTheme` setting in the extension page's localStorage. This preference is restored on later visits and synchronized between overview pages of the same extension; browsing content is not saved or uploaded.

The interface initially selects a supported language from the browser's preferences: Simplified Chinese, English, Japanese, or Korean, with English as the fallback. A manual selection is saved locally as `orbitLanguage`. Translations are bundled; page content is not sent to a translation service. Manual refresh rereads local tabs and is not cloud synchronization. The old `orbitTheme` and `orbitLanguage` key names remain solely to preserve existing preferences during the rebrand.

Reading or displaying tabs does not close them automatically. Bulk duplicate cleanup requires a selection and confirmation, and checks tab state again before closing. An individual row's close button directly closes that tab at the user's request. Check for unsaved work before closing pages.

Search text and current selections are not persistently saved. Closing an overview ends its runtime memory. Uninstalling the extension can remove its local extension storage. There is no cloud data or server-side browsing record for which a deletion request is needed.

### Limits on data use

Dotdash's use of information obtained through Chrome's extension interfaces complies with the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), including the [Limited Use requirements](https://developer.chrome.com/docs/webstore/program-policies/limited-use). Information is used only for the disclosed local tab-management functions. It is not sold or used for advertising, creditworthiness, or lending, and the developer and third parties are not given access to view browsing content.

### Contact

Report privacy questions through the [project's GitHub Issues](https://github.com/rockcc20-max/orbit-tab-organizer/issues). Before posting publicly, remove personal information, private URLs, access tokens, and any tab content you do not want to disclose.
