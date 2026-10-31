// Cache Storage is shared by every project under an origin, unlike SW scopes.
export function offlineCachePrefix(root){return 'document-studio-shell-'+encodeURIComponent(new URL(root).pathname)+'-'}
export function validOfflineCache(name,root){const prefix=offlineCachePrefix(root);return typeof name==='string'&&(name.startsWith(prefix)&&/^[a-f0-9]{16}$/.test(name.slice(prefix.length))||new URL(root).pathname==='/'&&/^document-studio-shell-[a-f0-9]{16}$/.test(name))}
