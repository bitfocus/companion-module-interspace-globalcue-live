export const BASE_URL = 'https://globalcue.live/api'

/** Time to wait for a long-poll response before aborting and starting a new one. */
export const LONG_POLL_TIMEOUT_MS = 90_000

/** Time to wait after a failed request before retrying, to avoid a hot error loop. */
export const RETRY_DELAY_MS = 3_000

export type CueName = 'forward' | 'back' | 'black'
export type ControlName = 'pause' | 'play' | 'solo'

export interface PresenterStatus {
	seq: number
	id: string
	name: string
	activeHandsetCount: number
	pause: boolean
	play: boolean
	solo: boolean
}

export class GlobalCueApiError extends Error {}

async function fetchWithTimeout(
	url: string,
	init: RequestInit,
	timeoutMs: number,
	outerSignal?: AbortSignal,
): Promise<Response> {
	const controller = new AbortController()
	const onOuterAbort = (): void => controller.abort()
	outerSignal?.addEventListener('abort', onOuterAbort)
	const timer = setTimeout(() => controller.abort(), timeoutMs)
	try {
		return await fetch(url, { ...init, signal: controller.signal })
	} finally {
		clearTimeout(timer)
		outerSignal?.removeEventListener('abort', onOuterAbort)
	}
}

/** POST a cue or control command for a presenter. Both cues (forward/back/black) and controls (pause/play/solo) use the same endpoint shape. */
export async function sendPresenterCommand(
	presenterId: string,
	command: CueName | ControlName,
	signal?: AbortSignal,
): Promise<void> {
	const url = `${BASE_URL}/presenter/${encodeURIComponent(command)}/${encodeURIComponent(presenterId)}`
	const res = await fetchWithTimeout(url, { method: 'POST' }, LONG_POLL_TIMEOUT_MS, signal)
	if (!res.ok) {
		throw new GlobalCueApiError(`GlobalCue request failed (${res.status} ${res.statusText})`)
	}
}

/** Simple 1/0 feedback check for a single pause/play/solo status. */
export async function getPresenterSimpleStatus(
	presenterId: string,
	control: ControlName,
	signal?: AbortSignal,
): Promise<boolean> {
	const url = `${BASE_URL}/presenter/${encodeURIComponent(control)}/${encodeURIComponent(presenterId)}`
	const res = await fetchWithTimeout(url, { method: 'GET' }, LONG_POLL_TIMEOUT_MS, signal)
	if (!res.ok) {
		throw new GlobalCueApiError(`GlobalCue status request failed (${res.status} ${res.statusText})`)
	}
	const text = (await res.text()).trim()
	return text === '1'
}

/** Long-polling advanced status for a single presenter. Resolves when the presenter's state changes (or the request times out). */
export async function getPresenterStatus(
	presenterId: string,
	seq: number,
	signal?: AbortSignal,
): Promise<PresenterStatus> {
	const url = `${BASE_URL}/presenter/${encodeURIComponent(presenterId)}/status?seq=${encodeURIComponent(String(seq))}`
	const res = await fetchWithTimeout(url, { method: 'GET' }, LONG_POLL_TIMEOUT_MS, signal)
	if (!res.ok) {
		throw new GlobalCueApiError(`GlobalCue status request failed (${res.status} ${res.statusText})`)
	}
	return (await res.json()) as PresenterStatus
}

export interface SessionPresentersResult {
	seq: number
	presenters: PresenterStatus[]
}

/** Long-polling status for every presenter in a session. The exact response shape isn't documented in detail, so this is parsed defensively. */
export async function getSessionPresenters(
	sessionId: string,
	seq: number,
	signal?: AbortSignal,
): Promise<SessionPresentersResult> {
	const url = `${BASE_URL}/session/${encodeURIComponent(sessionId)}/Presenters?seq=${encodeURIComponent(String(seq))}`
	const res = await fetchWithTimeout(url, { method: 'GET' }, LONG_POLL_TIMEOUT_MS, signal)
	if (!res.ok) {
		throw new GlobalCueApiError(`GlobalCue session request failed (${res.status} ${res.statusText})`)
	}
	const data: unknown = await res.json()
	return normalizeSessionPresenters(data)
}

function isPresenterLike(value: unknown): value is PresenterStatus {
	return !!value && typeof value === 'object' && 'id' in value
}

function normalizeSessionPresenters(data: unknown): SessionPresentersResult {
	if (Array.isArray(data)) {
		return { seq: 0, presenters: data.filter(isPresenterLike) }
	}
	if (data && typeof data === 'object') {
		const obj = data as Record<string, unknown>
		const seq = typeof obj.seq === 'number' ? obj.seq : 0
		const arrayField = obj.presenters ?? obj.Presenters ?? obj.items ?? obj.Items
		if (Array.isArray(arrayField)) {
			return { seq, presenters: arrayField.filter(isPresenterLike) }
		}
		// Fall back to treating the object's own values as a map of presenter statuses
		const values = Object.values(obj).filter(isPresenterLike)
		if (values.length > 0) {
			return { seq, presenters: values }
		}
	}
	return { seq: 0, presenters: [] }
}
