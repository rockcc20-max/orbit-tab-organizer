// Local vector fallbacks keep the preview useful offline. Live tabs use Chrome's favicon cache.
export function brandIcon(name) {
  const shapes = {
    YouTube: '<rect x="1" y="5" width="30" height="22" rx="7" fill="#FF0033"/><path d="m13 10 10 6-10 6z" fill="white"/>',
    Figma: '<path d="M8 1h8v10H8a5 5 0 0 1 0-10" fill="#F24E1E"/><path d="M16 1h8a5 5 0 0 1 0 10h-8" fill="#FF7262"/><path d="M8 11h8v10H8a5 5 0 0 1 0-10" fill="#A259FF"/><circle cx="21" cy="16" r="5" fill="#1ABCFE"/><path d="M8 21h8v5a5 5 0 1 1-8-4" fill="#0ACF83"/>',
    GitHub: '<circle cx="16" cy="16" r="15" fill="#24292F"/><path d="M9 12 8 6l6 3h4l6-3-1 6c4 8-1 12-7 12S5 20 9 12Z" fill="white"/><path d="M13 24v7m6-7v7M12 27C5 27 9 21 4 22" stroke="white" stroke-width="3" fill="none"/>',
    Notion: '<rect x="3" y="3" width="26" height="26" rx="3" fill="white" stroke="#242424" stroke-width="2"/><path d="M9 24V9h4l10 15V9M7 9h8M19 9h6M7 24h7" fill="none" stroke="#242424" stroke-width="2.3"/>',
    'Google Docs': '<path d="M7 1h13l6 6v24H7z" fill="#4285F4"/><path d="M20 1v7h6" fill="#A1C2FA"/><path d="M11 14h11M11 18h11M11 22h8" stroke="white" stroke-width="1.7"/>',
    Gemini: '<path d="M16 1C18 10 22 14 31 16 22 18 18 22 16 31 14 22 10 18 1 16 10 14 14 10 16 1Z" fill="#7A86E8"/><path d="M16 1C18 10 22 14 31 16H16Z" fill="#4B9BED"/><path d="M1 16C10 18 14 22 16 31V16Z" fill="#B083D9"/>',
    X: '<rect width="32" height="32" rx="7" fill="#151515"/><path d="M8 7h5l12 18h-5zM24 7 8 25" stroke="white" stroke-width="1.5" fill="none"/>',
    TradingView: '<path d="M2 13h13v6H2zM9 19h6v11H9zM18 13h6v6h-6zM25 13h6L21 30h-6z" fill="#2962FF"/><circle cx="21" cy="6" r="4" fill="#2962FF"/>',
    Google: '<path d="M29 16c0-1-.1-2-.3-3H16v6h7c-1 4-4 6-7 6a9 9 0 1 1 6-16l4-4A15 15 0 1 0 31 16" fill="#4285F4"/><path d="M4 7A15 15 0 0 1 26 5l-4 4A9 9 0 0 0 9 12" fill="#EA4335"/><path d="M9 12a9 9 0 0 0 0 8l-5 5a15 15 0 0 1 0-18" fill="#FBBC05"/><path d="M9 20a9 9 0 0 0 13 3l4 4A15 15 0 0 1 4 25" fill="#34A853"/>'
  };
  return shapes[name] ? '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">' + shapes[name] + '</svg>' : "";
}

export function uiIcon(name) {
  const paths = {
    page: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h4M9 12h6M9 16h6"/>',
    pin: '<path d="m9 3 6 0-1 6 4 4H6l4-4-1-6ZM12 13v8"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    sound: '<path d="M4 9h4l5-4v14l-5-4H4zM17 8c3 2 3 6 0 8"/>'
  };
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.page) + '</svg>';
}
