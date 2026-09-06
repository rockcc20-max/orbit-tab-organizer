(() => {
  "use strict";

  const STORAGE_KEY = "orbitLanguage";
  const catalogs = {
    "zh-CN": {
      "theme.switchToLight": "切换到白天模式", "theme.switchToDark": "切换到暗色模式",
      "app.title": "Orbit · 标签页总览", "app.home": "Orbit 首页", "app.workspace": "网站与标签页", "app.loading": "正在读取标签页…",
      "help.open": "使用说明", "demo.notice": "当前为预览示例。加载 Chrome 扩展后，这里会显示你真实打开的页面。",
      "filters.label": "筛选标签页", "filters.all": "全部网站", "filters.duplicates": "重复标签页",
      "sort.label": "网站排序", "sort.count": "按标签页数量", "sort.recent": "按最近访问", "sort.name": "按网站名称",
      "search.placeholder": "搜索网站或页面…", "search.label": "搜索网站或页面",
      "selection.hint": "每组保留一个页面", "selection.summary": "已选 {selected} / {total} 个重复项", "selection.all": "全选重复项", "selection.none": "取消全选", "selection.close": "关闭选中项", "selection.closeCount": "关闭选中项（{count}）",
      "footer.tagline": "给打开的页面，一个清楚的位置。", "footer.local": "本地整理",
      "dialog.close": "关闭对话框", "dialog.cancel": "取消", "dialog.confirm": "确认", "dialog.gotIt": "知道了",
      "theme.menu": "外观模式", "theme.system": "跟随浏览器", "theme.light": "白天模式", "theme.dark": "黑夜模式", "theme.toggle": "切换外观，当前：{mode}", "theme.title": "外观：{mode}", "theme.saveError": "外观已切换，但浏览器无法保存设置；重新打开后可能恢复原来的外观。",
      "language.label": "界面语言", "language.system": "自动", "language.saveError": "语言已切换，但浏览器无法保存设置；重新打开后可能恢复原来的语言。",
      "sync.manual": "手动同步", "sync.loading": "正在同步…", "sync.live": "已实时同步", "sync.demo": "预览模式", "sync.failure": "同步失败", "sync.retry": "重新同步", "sync.success": "标签页已同步", "sync.demoSuccess": "示例标签页已刷新", "sync.failedToast": "同步失败，已保留上次结果。请稍后重试。", "sync.errorTitle": "暂时无法同步标签页", "sync.errorDescription": "上次读取的页面会保留。请重新同步或重新打开 Orbit。详情：{error}", "sync.unknownError": "浏览器暂时无法读取标签页",
      "summary": "共 {tabs}，来自 {sites}{windows}。", "summary.tabs": "{count} 个标签页", "summary.tabs.one": "{count} 个标签页", "summary.sites": "{count} 个网站", "summary.sites.one": "{count} 个网站", "summary.windows": "、{count} 个窗口", "summary.windows.one": "、{count} 个窗口",
      "greeting.night": "夜深了，", "greeting.nightNote": "别忘了给自己一点休息。", "greeting.morning": "早上好，", "greeting.morningNote": "愿今天从容一点。", "greeting.noon": "中午好，", "greeting.noonNote": "忙碌之余，也照顾好自己。", "greeting.afternoon": "下午好，", "greeting.afternoonNote": "慢慢来，每一步都算数。", "greeting.evening": "辛苦了，", "greeting.eveningNote": "让思绪慢慢归位。",
      "site.logo": "{name} 标志", "site.total": "标签页数量", "tab.untitled": "未命名页面", "tab.select": "选择重复页面：{title}", "tab.focus": "切换到：{title}", "tab.duplicate": "重复", "tab.active": "正在使用", "tab.pinned": "已固定", "tab.discarded": "已休眠", "tab.window": "窗口 {number}", "tab.closeTitle": "关闭页面", "tab.close": "关闭：{title}",
      "results.duplicates": "包含重复页面的网站", "results.all": "已打开的网站", "results.summary": "找到 {tabs} · {sites}", "results.hint": "按网站自动汇总 · 点击页面即可切换",
      "empty.searchTitle": "没有找到相关页面", "empty.searchDescription": "试试网站名称、网页标题或网址。", "empty.clear": "清除搜索", "empty.duplicatesTitle": "没有可清理的重复项", "empty.duplicatesDescription": "相同网址只保留一份；固定、正在使用或播放声音的页面会受到保护。", "empty.all": "查看全部网站", "empty.title": "这里还没有打开的页面", "empty.description": "打开几个网页，它们就会按网站出现在这里。",
      "help.title": "把已打开的页面，汇总到这里", "help.description": "在 Chrome 中点击 Orbit 图标，即可查看所有窗口的标签页。每个网站的页面都会直接展开。",
      "help.demo1": "在 Chrome 地址栏打开 chrome://extensions。", "help.demo2": "开启“开发者模式”，点击“加载已解压的扩展程序”，选择解压后包含 manifest.json 的扩展文件夹；从源码打包时选择 dist/Orbit。", "help.demo3": "已安装过 Orbit？点击扩展卡片上的刷新按钮，再打开 Orbit。",
      "help.step1": "在 Chrome 工具栏的拼图菜单中固定 Orbit，点击图标即可打开总览。", "help.step2": "左侧切换全部网站或重复标签页，右侧搜索；点击页面名称可回到原标签页。", "help.step3": "清理重复页面时，先勾选，再点击“关闭选中项”并确认。关闭前请注意未保存的内容。", "help.privacy": "Orbit 仅在本机读取当前标签页的标题、网址与窗口状态用于整理，不上传浏览信息。", "help.preferences": "语言框默认显示本地语言，下拉可选择其他语言。太阳／月亮按钮可直接切换明暗，初始跟随浏览器。语言和外观都会记住手动选择；右上角也可手动同步。", "help.shortcut": "快捷打开：Mac 使用 ⌘ ⇧ 0，Windows / Linux 使用 Ctrl Shift 0。",
      "toast.previewFocus": "预览：已选中「{title}」", "toast.tabClosed": "页面已关闭", "toast.failed": "操作未完成：{error}", "toast.changed": "标签页正在变化，请重新确认。", "toast.duplicatesClosed": "已关闭 {count} 个重复页面。", "toast.duplicatesClosed.one": "已关闭 {count} 个重复页面。", "toast.skipped": " 已跳过状态发生变化的页面。", "toast.noneClosed": "页面状态已变化，本次未关闭任何页面。",
      "duplicates.title": "关闭 {count} 个重复页面？", "duplicates.title.one": "关闭 {count} 个重复页面？", "duplicates.description": "仅关闭下面勾选的页面。同网址的另一份页面会保留。", "duplicates.confirm": "确认关闭"
    },
    en: {
      "theme.switchToLight": "Switch to light mode", "theme.switchToDark": "Switch to dark mode",
      "app.title": "Orbit · Tab overview", "app.home": "Orbit home", "app.workspace": "Websites and tabs", "app.loading": "Reading your tabs…",
      "help.open": "Help", "demo.notice": "This is a preview with sample tabs. Install the Chrome extension to see your own open pages.",
      "filters.label": "Filter tabs", "filters.all": "All websites", "filters.duplicates": "Duplicate tabs",
      "sort.label": "Sort websites", "sort.count": "By tab count", "sort.recent": "Recently visited", "sort.name": "By website name",
      "search.placeholder": "Search websites or pages…", "search.label": "Search websites or pages",
      "selection.hint": "Keep one page in each group", "selection.summary": "{selected} / {total} duplicates selected", "selection.all": "Select all duplicates", "selection.none": "Deselect all", "selection.close": "Close selected", "selection.closeCount": "Close selected ({count})",
      "footer.tagline": "A clear place for every open page.", "footer.local": "Organized on your device",
      "dialog.close": "Close dialog", "dialog.cancel": "Cancel", "dialog.confirm": "Confirm", "dialog.gotIt": "Got it",
      "theme.menu": "Appearance", "theme.system": "Use browser setting", "theme.light": "Light mode", "theme.dark": "Dark mode", "theme.toggle": "Change appearance, current: {mode}", "theme.title": "Appearance: {mode}", "theme.saveError": "Appearance changed, but the browser could not save it. Reopening may restore the previous appearance.",
      "language.label": "Interface language", "language.system": "Auto", "language.saveError": "Language changed, but the browser could not save it. Reopening may restore the previous language.",
      "sync.manual": "Sync now", "sync.loading": "Syncing…", "sync.live": "Up to date", "sync.demo": "Preview mode", "sync.failure": "Sync failed", "sync.retry": "Try again", "sync.success": "Tabs are up to date", "sync.demoSuccess": "Sample tabs refreshed", "sync.failedToast": "Sync failed. Your last results are still here. Please try again.", "sync.errorTitle": "Could not sync your tabs", "sync.errorDescription": "Your last results are kept. Try syncing again or reopen Orbit. Details: {error}", "sync.unknownError": "The browser could not read your tabs",
      "summary": "{tabs} across {sites}{windows}.", "summary.tabs": "{count} tabs", "summary.tabs.one": "{count} tab", "summary.sites": "{count} websites", "summary.sites.one": "{count} website", "summary.windows": ", {count} windows", "summary.windows.one": ", {count} window",
      "greeting.night": "Still up? ", "greeting.nightNote": "Save a little time to rest.", "greeting.morning": "Good morning, ", "greeting.morningNote": "here’s to a gentler start.", "greeting.noon": "Hello there, ", "greeting.noonNote": "take a little break for yourself.", "greeting.afternoon": "Good afternoon, ", "greeting.afternoonNote": "one step at a time is enough.", "greeting.evening": "You’ve done a lot today. ", "greeting.eveningNote": "Let your thoughts settle.",
      "site.logo": "{name} logo", "site.total": "Number of tabs", "tab.untitled": "Untitled page", "tab.select": "Select duplicate: {title}", "tab.focus": "Switch to: {title}", "tab.duplicate": "Duplicate", "tab.active": "Active", "tab.pinned": "Pinned", "tab.discarded": "Sleeping", "tab.window": "Window {number}", "tab.closeTitle": "Close page", "tab.close": "Close: {title}",
      "results.duplicates": "Websites with duplicate pages", "results.all": "Open websites", "results.summary": "Found {tabs} · {sites}", "results.hint": "Grouped by website · Click a page to switch",
      "empty.searchTitle": "No matching pages", "empty.searchDescription": "Try a website name, page title, or URL.", "empty.clear": "Clear search", "empty.duplicatesTitle": "No duplicates to clean up", "empty.duplicatesDescription": "One copy of each URL is kept. Pinned, active, or audible pages are protected.", "empty.all": "Show all websites", "empty.title": "No open pages yet", "empty.description": "Open a few pages and they’ll appear here, grouped by website.",
      "help.title": "Your open pages, together", "help.description": "Click the Orbit icon in Chrome to see tabs from all your windows. Every website’s pages are shown without expanding anything.",
      "help.demo1": "Open chrome://extensions in the Chrome address bar.", "help.demo2": "Enable Developer mode, choose Load unpacked, and select the extracted extension folder containing manifest.json. When building from source, select dist/Orbit.", "help.demo3": "Already installed Orbit? Click Reload on its extension card, then open Orbit again.",
      "help.step1": "Pin Orbit from the puzzle-piece menu in Chrome’s toolbar. Click its icon to open the overview.", "help.step2": "Switch between all websites and duplicate tabs on the left, and search on the right. Click a page name to return to its tab.", "help.step3": "To remove duplicates, select them, choose Close selected, and confirm. Check for unsaved work before closing pages.", "help.privacy": "Orbit reads current tab titles, URLs, and window states only on your device to organize them. It does not upload browsing information.", "help.preferences": "The language selector starts with your local language; choose another from the list. Click the sun or moon to switch appearance, which initially follows your browser. Manual choices are remembered. You can also sync from the top-right controls.", "help.shortcut": "Quick open: ⌘ ⇧ 0 on Mac, or Ctrl Shift 0 on Windows / Linux.",
      "toast.previewFocus": "Preview: selected “{title}”", "toast.tabClosed": "Page closed", "toast.failed": "Could not complete the action: {error}", "toast.changed": "Your tabs are changing. Please confirm again.", "toast.duplicatesClosed": "Closed {count} duplicate pages.", "toast.duplicatesClosed.one": "Closed {count} duplicate page.", "toast.skipped": " Pages whose state changed were skipped.", "toast.noneClosed": "Page states changed. No pages were closed.",
      "duplicates.title": "Close {count} duplicate pages?", "duplicates.title.one": "Close {count} duplicate page?", "duplicates.description": "Only the selected pages below will close. Another copy of each URL will stay open.", "duplicates.confirm": "Confirm and close"
    },
    ko: {
      "theme.switchToLight": "라이트 모드로 전환", "theme.switchToDark": "다크 모드로 전환",
      "app.title": "Orbit · 탭 모아보기", "app.home": "Orbit 홈", "app.workspace": "웹사이트와 탭", "app.loading": "탭을 불러오는 중…",
      "help.open": "사용 안내", "demo.notice": "예시 탭으로 보는 미리보기입니다. Chrome 확장 프로그램을 설치하면 실제로 열어 둔 페이지가 표시됩니다.",
      "filters.label": "탭 필터", "filters.all": "모든 웹사이트", "filters.duplicates": "중복 탭",
      "sort.label": "웹사이트 정렬", "sort.count": "탭 개수순", "sort.recent": "최근 방문순", "sort.name": "웹사이트 이름순",
      "search.placeholder": "웹사이트 또는 페이지 검색…", "search.label": "웹사이트 또는 페이지 검색",
      "selection.hint": "그룹마다 페이지 하나는 남겨 둡니다", "selection.summary": "중복 항목 {total}개 중 {selected}개 선택", "selection.all": "중복 항목 모두 선택", "selection.none": "전체 선택 해제", "selection.close": "선택 항목 닫기", "selection.closeCount": "선택 항목 닫기 ({count})",
      "footer.tagline": "열어 둔 모든 페이지를 한눈에.", "footer.local": "기기 안에서 정리",
      "dialog.close": "대화상자 닫기", "dialog.cancel": "취소", "dialog.confirm": "확인", "dialog.gotIt": "알겠어요",
      "theme.menu": "화면 모드", "theme.system": "브라우저 설정 따르기", "theme.light": "라이트 모드", "theme.dark": "다크 모드", "theme.toggle": "화면 모드 변경, 현재: {mode}", "theme.title": "화면 모드: {mode}", "theme.saveError": "화면 모드는 변경되었지만 설정을 저장하지 못했습니다. 다시 열면 이전 화면 모드로 돌아갈 수 있습니다.",
      "language.label": "표시 언어", "language.system": "자동", "language.saveError": "언어는 변경되었지만 설정을 저장하지 못했습니다. 다시 열면 이전 언어로 돌아갈 수 있습니다.",
      "sync.manual": "지금 동기화", "sync.loading": "동기화 중…", "sync.live": "최신 상태", "sync.demo": "미리보기 모드", "sync.failure": "동기화 실패", "sync.retry": "다시 동기화", "sync.success": "탭이 동기화되었습니다", "sync.demoSuccess": "예시 탭을 새로고침했습니다", "sync.failedToast": "동기화하지 못했습니다. 이전 결과는 유지됩니다. 다시 시도해 주세요.", "sync.errorTitle": "탭을 동기화할 수 없습니다", "sync.errorDescription": "이전 결과는 유지됩니다. 다시 동기화하거나 Orbit을 다시 열어 주세요. 상세: {error}", "sync.unknownError": "브라우저에서 탭을 읽을 수 없습니다",
      "summary": "{sites}{windows}에서 {tabs}를 모았어요.", "summary.tabs": "탭 {count}개", "summary.tabs.one": "탭 {count}개", "summary.sites": "웹사이트 {count}개", "summary.sites.one": "웹사이트 {count}개", "summary.windows": ", 창 {count}개", "summary.windows.one": ", 창 {count}개",
      "greeting.night": "늦은 밤이네요. ", "greeting.nightNote": "잠시 쉬어 가는 것도 잊지 마세요.", "greeting.morning": "좋은 아침이에요. ", "greeting.morningNote": "오늘은 조금 더 여유롭게 시작해요.", "greeting.noon": "점심시간이에요. ", "greeting.noonNote": "바쁜 중에도 나를 챙겨 주세요.", "greeting.afternoon": "좋은 오후예요. ", "greeting.afternoonNote": "한 걸음씩, 천천히 가도 괜찮아요.", "greeting.evening": "오늘도 수고했어요. ", "greeting.eveningNote": "복잡했던 생각을 잠시 정리해요.",
      "site.logo": "{name} 로고", "site.total": "탭 수", "tab.untitled": "제목 없는 페이지", "tab.select": "중복 페이지 선택: {title}", "tab.focus": "다음 페이지로 이동: {title}", "tab.duplicate": "중복", "tab.active": "사용 중", "tab.pinned": "고정됨", "tab.discarded": "휴면 상태", "tab.window": "창 {number}", "tab.closeTitle": "페이지 닫기", "tab.close": "닫기: {title}",
      "results.duplicates": "중복 페이지가 있는 웹사이트", "results.all": "열린 웹사이트", "results.summary": "검색 결과: {tabs} · {sites}", "results.hint": "웹사이트별로 모아보기 · 페이지를 클릭하면 이동합니다",
      "empty.searchTitle": "일치하는 페이지가 없습니다", "empty.searchDescription": "웹사이트 이름, 페이지 제목 또는 URL로 검색해 보세요.", "empty.clear": "검색 지우기", "empty.duplicatesTitle": "정리할 중복 항목이 없습니다", "empty.duplicatesDescription": "같은 URL의 페이지 하나는 유지됩니다. 고정된 탭, 사용 중인 탭, 소리가 나는 탭은 보호됩니다.", "empty.all": "모든 웹사이트 보기", "empty.title": "아직 열린 페이지가 없습니다", "empty.description": "웹페이지를 열면 웹사이트별로 모아 보여 드릴게요.",
      "help.title": "열어 둔 페이지를 한곳에", "help.description": "Chrome에서 Orbit 아이콘을 클릭하면 모든 창의 탭을 볼 수 있습니다. 각 웹사이트의 페이지는 바로 펼쳐서 보여 줍니다.",
      "help.demo1": "Chrome 주소창에서 chrome://extensions를 여세요.", "help.demo2": "개발자 모드를 켜고 ‘압축해제된 확장 프로그램을 로드합니다’를 선택한 다음, manifest.json이 들어 있는 확장 프로그램 폴더를 선택하세요. 소스에서 빌드한 경우 dist/Orbit을 선택하세요.", "help.demo3": "이미 설치했나요? 확장 프로그램 카드의 새로고침 버튼을 클릭한 뒤 Orbit을 다시 여세요.",
      "help.step1": "Chrome 도구 모음의 퍼즐 메뉴에서 Orbit을 고정하세요. 아이콘을 클릭하면 모아보기가 열립니다.", "help.step2": "왼쪽에서 모든 웹사이트와 중복 탭을 전환하고, 오른쪽에서 검색하세요. 페이지 이름을 클릭하면 원래 탭으로 이동합니다.", "help.step3": "중복 페이지를 선택한 뒤 ‘선택 항목 닫기’를 누르고 확인하세요. 닫기 전에 저장하지 않은 내용이 있는지 확인해 주세요.", "help.privacy": "Orbit은 정리를 위해 현재 탭의 제목, URL, 창 상태를 기기 안에서만 읽습니다. 탐색 정보를 업로드하지 않습니다.", "help.preferences": "언어 목록에는 처음에 브라우저 언어가 표시되며 다른 언어를 바로 선택할 수 있습니다. 화면 모드는 처음에 브라우저를 따르고, 해 또는 달 버튼으로 전환합니다. 직접 선택한 설정은 저장됩니다. 오른쪽 위에서 수동 동기화도 할 수 있습니다.", "help.shortcut": "빠르게 열기: Mac은 ⌘ ⇧ 0, Windows / Linux는 Ctrl Shift 0을 사용하세요.",
      "toast.previewFocus": "미리보기: ‘{title}’ 선택됨", "toast.tabClosed": "페이지를 닫았습니다", "toast.failed": "작업을 완료하지 못했습니다: {error}", "toast.changed": "탭 상태가 변경되고 있습니다. 다시 확인해 주세요.", "toast.duplicatesClosed": "중복 페이지 {count}개를 닫았습니다.", "toast.duplicatesClosed.one": "중복 페이지 {count}개를 닫았습니다.", "toast.skipped": " 상태가 변경된 페이지는 건너뛰었습니다.", "toast.noneClosed": "페이지 상태가 변경되어 아무 페이지도 닫지 않았습니다.",
      "duplicates.title": "중복 페이지 {count}개를 닫을까요?", "duplicates.title.one": "중복 페이지 {count}개를 닫을까요?", "duplicates.description": "아래에서 선택한 페이지만 닫습니다. 같은 URL의 다른 페이지 하나는 열어 둡니다.", "duplicates.confirm": "확인하고 닫기"
    },
    ja: {
      "theme.switchToLight": "ライトモードに切り替える", "theme.switchToDark": "ダークモードに切り替える",
      "app.title": "Orbit · タブ一覧", "app.home": "Orbit ホーム", "app.workspace": "ウェブサイトとタブ", "app.loading": "タブを読み込み中…",
      "help.open": "使い方", "demo.notice": "サンプルのタブを使ったプレビューです。Chrome 拡張機能をインストールすると、実際に開いているページが表示されます。",
      "filters.label": "タブの絞り込み", "filters.all": "すべてのサイト", "filters.duplicates": "重複タブ",
      "sort.label": "サイトの並べ替え", "sort.count": "タブ数順", "sort.recent": "最近アクセスした順", "sort.name": "サイト名順",
      "search.placeholder": "サイトやページを検索…", "search.label": "サイトやページを検索",
      "selection.hint": "各グループで 1 ページを残します", "selection.summary": "重複 {total} 件のうち {selected} 件を選択", "selection.all": "重複をすべて選択", "selection.none": "すべての選択を解除", "selection.close": "選択したタブを閉じる", "selection.closeCount": "選択したタブを閉じる（{count}）",
      "footer.tagline": "開いたページに、わかりやすい居場所を。", "footer.local": "端末内で整理",
      "dialog.close": "ダイアログを閉じる", "dialog.cancel": "キャンセル", "dialog.confirm": "確認", "dialog.gotIt": "わかりました",
      "theme.menu": "表示モード", "theme.system": "ブラウザに合わせる", "theme.light": "ライトモード", "theme.dark": "ダークモード", "theme.toggle": "表示モードを変更、現在：{mode}", "theme.title": "表示モード：{mode}", "theme.saveError": "表示モードを変更しましたが、設定を保存できませんでした。開き直すと以前の表示に戻る場合があります。",
      "language.label": "表示言語", "language.system": "自動", "language.saveError": "言語を変更しましたが、設定を保存できませんでした。開き直すと以前の言語に戻る場合があります。",
      "sync.manual": "今すぐ同期", "sync.loading": "同期中…", "sync.live": "最新の状態です", "sync.demo": "プレビューモード", "sync.failure": "同期に失敗", "sync.retry": "再同期", "sync.success": "タブを同期しました", "sync.demoSuccess": "サンプルのタブを更新しました", "sync.failedToast": "同期できませんでした。前回の結果は保持されています。もう一度お試しください。", "sync.errorTitle": "タブを同期できません", "sync.errorDescription": "前回の結果は保持されています。再同期するか、Orbit を開き直してください。詳細：{error}", "sync.unknownError": "ブラウザからタブを読み込めません",
      "summary": "{sites}{windows}の{tabs}をまとめました。", "summary.tabs": "タブ {count} 個", "summary.tabs.one": "タブ {count} 個", "summary.sites": "{count} サイト", "summary.sites.one": "{count} サイト", "summary.windows": "・{count} ウィンドウ", "summary.windows.one": "・{count} ウィンドウ",
      "greeting.night": "夜も更けてきましたね。", "greeting.nightNote": "ひと休みする時間も大切に。", "greeting.morning": "おはようございます。", "greeting.morningNote": "今日は少し、ゆとりを持って。", "greeting.noon": "こんにちは。", "greeting.noonNote": "忙しい合間に、ひと息つきましょう。", "greeting.afternoon": "お疲れさまです。", "greeting.afternoonNote": "一歩ずつ、自分のペースで。", "greeting.evening": "今日もお疲れさまでした。", "greeting.eveningNote": "考えごとを、ゆっくり整えましょう。",
      "site.logo": "{name} のロゴ", "site.total": "タブ数", "tab.untitled": "無題のページ", "tab.select": "重複ページを選択：{title}", "tab.focus": "切り替え先：{title}", "tab.duplicate": "重複", "tab.active": "使用中", "tab.pinned": "固定済み", "tab.discarded": "休止中", "tab.window": "ウィンドウ {number}", "tab.closeTitle": "ページを閉じる", "tab.close": "閉じる：{title}",
      "results.duplicates": "重複ページがあるサイト", "results.all": "開いているサイト", "results.summary": "検索結果：{tabs} · {sites}", "results.hint": "サイト別に自動整理 · ページをクリックして切り替え",
      "empty.searchTitle": "一致するページがありません", "empty.searchDescription": "サイト名、ページのタイトル、URL で検索してみてください。", "empty.clear": "検索をクリア", "empty.duplicatesTitle": "整理できる重複はありません", "empty.duplicatesDescription": "同じ URL のページは 1 つ残します。固定済み、使用中、音声再生中のページは保護されます。", "empty.all": "すべてのサイトを表示", "empty.title": "まだページが開いていません", "empty.description": "ウェブページを開くと、サイト別にここに表示されます。",
      "help.title": "開いているページを、ひとつの場所に", "help.description": "Chrome で Orbit アイコンをクリックすると、すべてのウィンドウのタブを確認できます。各サイトのページは最初からすべて表示されます。",
      "help.demo1": "Chrome のアドレスバーで chrome://extensions を開きます。", "help.demo2": "デベロッパーモードを有効にし、「パッケージ化されていない拡張機能を読み込む」から manifest.json を含む解凍済みフォルダを選びます。ソースからビルドした場合は dist/Orbit を選びます。", "help.demo3": "インストール済みの場合は、拡張機能カードの更新ボタンをクリックしてから Orbit を開き直します。",
      "help.step1": "Chrome ツールバーのパズルメニューで Orbit を固定します。アイコンをクリックすると一覧が開きます。", "help.step2": "左側ですべてのサイトと重複タブを切り替え、右側で検索できます。ページ名をクリックすると元のタブに戻ります。", "help.step3": "重複ページを選択し、「選択したタブを閉じる」を押して確認します。閉じる前に、未保存の内容がないか確認してください。", "help.privacy": "Orbit は整理のため、現在のタブのタイトル、URL、ウィンドウの状態を端末内でのみ読み取ります。閲覧情報はアップロードしません。", "help.preferences": "言語欄には最初にブラウザの言語が表示され、一覧から別の言語を選べます。表示モードは最初にブラウザに従い、太陽・月ボタンで切り替えられます。手動の選択は保存されます。右上から手動同期もできます。", "help.shortcut": "すばやく開く：Mac は ⌘ ⇧ 0、Windows / Linux は Ctrl Shift 0。",
      "toast.previewFocus": "プレビュー：「{title}」を選択しました", "toast.tabClosed": "ページを閉じました", "toast.failed": "操作を完了できませんでした：{error}", "toast.changed": "タブの状態が変化しています。もう一度確認してください。", "toast.duplicatesClosed": "重複ページを {count} 個閉じました。", "toast.duplicatesClosed.one": "重複ページを {count} 個閉じました。", "toast.skipped": " 状態が変わったページはスキップしました。", "toast.noneClosed": "ページの状態が変わったため、今回は何も閉じませんでした。",
      "duplicates.title": "重複ページを {count} 個閉じますか？", "duplicates.title.one": "重複ページを {count} 個閉じますか？", "duplicates.description": "下で選択したページだけを閉じます。同じ URL の別のページは残します。", "duplicates.confirm": "確認して閉じる"
    }
  };
  const supportedLocales = Object.freeze(Object.keys(catalogs));
  for (const catalog of Object.values(catalogs)) Object.freeze(catalog);
  Object.freeze(catalogs);

  function normalize(value) {
    const language = typeof value === "string" ? value.toLowerCase().split(/[-_]/)[0] : "";
    return language === "zh" ? "zh-CN" : ["en", "ko", "ja"].includes(language) ? language : null;
  }

  function browserLocale() {
    const languages = [...(globalThis.navigator?.languages || []), globalThis.navigator?.language];
    for (const language of languages) {
      const resolved = normalize(language);
      if (resolved) return resolved;
    }
    return "en";
  }

  const validPreference = (value) => supportedLocales.includes(value) ? value : "system";
  let preference = "system";
  try { preference = validPreference(globalThis.localStorage.getItem(STORAGE_KEY)); } catch { /* Use the browser when storage is unavailable. */ }
  let locale = preference === "system" ? browserLocale() : preference;
  let controlsReady = false;
  let pendingSaveError = false;
  const subscribers = new Set();

  function t(key, params = {}) {
    const count = params._count ?? params.count;
    const pluralKey = Number(count) === 1 && Object.hasOwn(catalogs[locale], key + ".one") ? key + ".one" : key;
    const message = catalogs[locale][pluralKey] ?? catalogs.en[pluralKey] ?? key;
    return message.replace(/\{([\w]+)\}/g, (match, name) => Object.hasOwn(params, name) ? String(params[name]) : match);
  }

  function applyTranslations() {
    document.documentElement.lang = locale;
    document.title = t("app.title");
    if (!controlsReady) return;
    for (const [attribute, target] of [["data-i18n", "textContent"], ["data-i18n-placeholder", "placeholder"], ["data-i18n-aria-label", "aria-label"], ["data-i18n-title", "title"]]) {
      for (const element of document.querySelectorAll("[" + attribute + "]")) {
        const value = t(element.getAttribute(attribute));
        if (target === "textContent") element.textContent = value;
        else element.setAttribute(target, value);
      }
    }
    const control = document.getElementById("language-select");
    // Show the resolved local language, not the hidden automatic preference.
    if (control) control.value = locale;
  }

  function notify() {
    applyTranslations();
    const detail = { locale, preference };
    for (const subscriber of subscribers) subscriber(detail);
    if (typeof globalThis.CustomEvent === "function") globalThis.dispatchEvent(new CustomEvent("orbit:languagechange", { detail }));
  }

  function showSaveError() {
    const region = document.getElementById("toast-region");
    if (!region) { pendingSaveError = true; return; }
    const item = document.createElement("div");
    item.className = "toast";
    item.setAttribute("data-i18n", "language.saveError");
    item.textContent = t("language.saveError");
    region.append(item);
    setTimeout(() => item.remove(), 4500);
  }

  function setLanguage(value) {
    preference = validPreference(value);
    locale = preference === "system" ? browserLocale() : preference;
    let persisted = true;
    try { globalThis.localStorage.setItem(STORAGE_KEY, preference); } catch { persisted = false; }
    notify();
    if (!persisted) showSaveError();
    return persisted;
  }

  function initializeControls() {
    if (controlsReady) return;
    controlsReady = true;
    const control = document.getElementById("language-select");
    control?.addEventListener("change", () => setLanguage(control.value));
    applyTranslations();
    if (pendingSaveError) { pendingSaveError = false; showSaveError(); }
  }

  globalThis.OrbitI18n = Object.freeze({
    t, setLanguage, supportedLocales, catalogs,
    get locale() { return locale; },
    get preference() { return preference; },
    subscribe(callback) { subscribers.add(callback); return () => subscribers.delete(callback); }
  });
  applyTranslations();
  globalThis.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try { if (event.storageArea && event.storageArea !== globalThis.localStorage) return; } catch { return; }
    preference = validPreference(event.newValue);
    locale = preference === "system" ? browserLocale() : preference;
    notify();
  });
  globalThis.addEventListener("languagechange", () => {
    if (preference !== "system") return;
    locale = browserLocale();
    notify();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeControls, { once: true });
  else initializeControls();
})();
