export interface ProductionManifest {
	version: string // e.g. "rel-261113_3"
	date: string // e.g. "2026-11-13T22:46:59Z"
	stable: boolean
	/** Optional direct download URL for the dist archive. */
	url?: string
	/** Optional sha256 checksum (hex or prefixed with "sha256:"). */
	sha256?: string
	/** Optional archive size in bytes. */
	size?: number
	/** Optional human readable release notes. */
	notes?: string
}

export interface ReleaseVersions {
	tag: string
	app: string
	server: string
	native: string
}

export interface UpdaterConfig {
	manifestUrl: string
	storageDir: string
	bundledVersion: string
	/** Optional dist directory shipped with the app, used when no update is installed. */
	bundledDistPath?: string | null
	github: {
		owner: string
		repo: string
		assetName?: string // default: "dist.zip"
	}
	extractZip: (zipPath: string, destDir: string) => Promise<void>
	requireStable?: boolean
	allowRollback?: boolean
	requestTimeoutMs?: number
	downloadTimeoutMs?: number
	downloadAttempts?: number
}

export interface UpdaterState {
	activeVersion: string
	activeDate: string | null
	activeDistPath: string | null
	previousVersion?: string | null
	previousDate?: string | null
	previousDistPath?: string | null
	/** Version that failed to load and must not be installed again. */
	failedVersion?: string | null
	manifestEtag?: string
	lastCheckedAt?: string
}

export interface ActiveDist {
	path: string
	version: string
	date: string | null
	source: "update" | "bundled"
}

export interface UpdaterInfo {
	activeVersion: string
	activeDate: string | null
	activeDistPath: string | null
	activeSource: ActiveDist["source"] | null
	bundledVersion: string
	lastCheckedAt?: string
	updatesDir: string
}

export type CheckResult =
	| { status: "up-to-date"; version: string }
	| { status: "skipped-unstable"; manifest: ProductionManifest }
	| { status: "update-available"; manifest: ProductionManifest }
	| { status: "update-ready"; manifest: ProductionManifest; distPath: string }
	| { status: "error"; error: Error }
