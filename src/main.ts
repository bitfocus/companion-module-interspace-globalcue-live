import {
	InstanceBase,
	InstanceStatus,
	type DropdownChoice,
	type SomeCompanionConfigField,
} from '@companion-module/base'
import { GetConfigFields, MAX_MANUAL_PRESENTERS, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions, UpdateVariableValues, type VariablesSchema } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import {
	getPresenterSimpleStatus,
	getPresenterStatus,
	getSessionPresenters,
	sendPresenterCommand,
	RETRY_DELAY_MS,
	type ControlName,
	type CueName,
	type PresenterStatus,
} from './api.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

export interface PresenterState {
	id: string
	name: string
	activeHandsetCount: number
	pause: boolean
	play: boolean
	solo: boolean
}

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig // Setup in init()

	readonly presenters = new Map<string, PresenterState>()
	presenterOrder: string[] = []

	private pollGeneration = 0
	private readonly abortControllers = new Set<AbortController>()

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.startFresh()
	}

	// When module gets deleted
	async destroy(): Promise<void> {
		this.stopPolling()
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.stopPolling()
		this.config = config
		this.startFresh()
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	/** All presenters known so far, as dropdown choices for actions/feedbacks. */
	getPresenterChoices(): DropdownChoice<string>[] {
		return this.presenterOrder.map((id) => {
			const state = this.presenters.get(id)
			return { id, label: state?.name ? `${state.name} (${id})` : id }
		})
	}

	/** Send a cue or control command to a presenter. Used by actions. */
	async sendCommand(presenterId: string, command: CueName | ControlName): Promise<void> {
		const id = presenterId.trim()
		if (!id) {
			this.log('warn', 'GlobalCue action skipped: no presenter ID specified')
			return
		}
		try {
			await sendPresenterCommand(id, command)
		} catch (err) {
			this.log('warn', `GlobalCue command "${command}" for presenter ${id} failed: ${errorMessage(err)}`)
		}
	}

	/** Pause a presenter if playing, or resume if paused, based on the last known (or freshly fetched) state. */
	async togglePause(presenterId: string): Promise<void> {
		const id = presenterId.trim()
		if (!id) {
			this.log('warn', 'GlobalCue action skipped: no presenter ID specified')
			return
		}
		let isPaused = this.presenters.get(id)?.pause
		if (isPaused === undefined) {
			try {
				isPaused = await getPresenterSimpleStatus(id, 'pause')
			} catch (err) {
				this.log(
					'warn',
					`Could not determine pause state for presenter ${id}, defaulting to Pause: ${errorMessage(err)}`,
				)
				isPaused = false
			}
		}
		await this.sendCommand(id, isPaused ? 'play' : 'pause')
	}

	private startFresh(): void {
		this.presenters.clear()
		this.presenterOrder = []
		this.pollGeneration++

		const sessionId = this.config.sessionId.trim()
		if (!sessionId) {
			const configuredAny = this.seedManualPresenters()
			if (!configuredAny) {
				this.updateStatus(InstanceStatus.BadConfig, 'Please set a Session ID, or configure at least one Presenter ID')
			} else {
				this.updateStatus(InstanceStatus.Connecting)
			}
		} else {
			this.updateStatus(InstanceStatus.Connecting)
		}

		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		this.updateVariableDefinitions()
		UpdateVariableValues(this)

		this.startPolling()
	}

	private seedManualPresenters(): boolean {
		const cfg = this.config
		const slots: Array<[string, string]> = [
			[cfg.presenter1Id, cfg.presenter1Name],
			[cfg.presenter2Id, cfg.presenter2Name],
			[cfg.presenter3Id, cfg.presenter3Name],
			[cfg.presenter4Id, cfg.presenter4Name],
			[cfg.presenter5Id, cfg.presenter5Name],
			[cfg.presenter6Id, cfg.presenter6Name],
			[cfg.presenter7Id, cfg.presenter7Name],
			[cfg.presenter8Id, cfg.presenter8Name],
		]
		const count = Math.min(cfg.presenterCount || 0, MAX_MANUAL_PRESENTERS)
		for (let i = 0; i < count; i++) {
			const [idRaw, nameRaw] = slots[i]
			const id = (idRaw ?? '').trim()
			if (!id) continue
			const name = (nameRaw ?? '').trim() || id
			this.presenters.set(id, { id, name, activeHandsetCount: 0, pause: false, play: false, solo: false })
			this.presenterOrder.push(id)
		}
		return this.presenterOrder.length > 0
	}

	private startPolling(): void {
		const generation = this.pollGeneration
		const sessionId = this.config.sessionId.trim()
		if (sessionId) {
			void this.pollSessionLoop(sessionId, generation)
		} else {
			for (const id of [...this.presenterOrder]) {
				void this.pollPresenterLoop(id, generation)
			}
		}
	}

	private stopPolling(): void {
		this.pollGeneration++
		for (const controller of this.abortControllers) {
			controller.abort()
		}
		this.abortControllers.clear()
	}

	private async delay(ms: number): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, ms))
	}

	private noteConnected(): void {
		this.updateStatus(InstanceStatus.Ok)
	}

	private async pollPresenterLoop(presenterId: string, generation: number): Promise<void> {
		let seq = 0
		while (generation === this.pollGeneration) {
			const controller = new AbortController()
			this.abortControllers.add(controller)
			try {
				const status = await getPresenterStatus(presenterId, seq, controller.signal)
				this.abortControllers.delete(controller)
				if (generation !== this.pollGeneration) return
				seq = status.seq
				this.applyPresenterStatus(status)
				this.noteConnected()
			} catch (err) {
				this.abortControllers.delete(controller)
				if (generation !== this.pollGeneration) return
				this.log('debug', `Polling error for presenter ${presenterId}: ${errorMessage(err)}`)
				await this.delay(RETRY_DELAY_MS)
			}
		}
	}

	private async pollSessionLoop(sessionId: string, generation: number): Promise<void> {
		let seq = 0
		while (generation === this.pollGeneration) {
			const controller = new AbortController()
			this.abortControllers.add(controller)
			try {
				const result = await getSessionPresenters(sessionId, seq, controller.signal)
				this.abortControllers.delete(controller)
				if (generation !== this.pollGeneration) return
				seq = result.seq
				for (const status of result.presenters) {
					this.applyPresenterStatus(status)
				}
				this.noteConnected()
			} catch (err) {
				this.abortControllers.delete(controller)
				if (generation !== this.pollGeneration) return
				this.log('debug', `Polling error for session ${sessionId}: ${errorMessage(err)}`)
				await this.delay(RETRY_DELAY_MS)
			}
		}
	}

	private applyPresenterStatus(status: PresenterStatus): void {
		if (!status || !status.id) return
		const isNew = !this.presenters.has(status.id)
		this.presenters.set(status.id, {
			id: status.id,
			name: status.name?.trim() || this.presenters.get(status.id)?.name || status.id,
			activeHandsetCount: status.activeHandsetCount ?? 0,
			pause: !!status.pause,
			play: !!status.play,
			solo: !!status.solo,
		})
		if (isNew) {
			this.presenterOrder.push(status.id)
		}

		UpdateVariableValues(this, status.id)
		this.checkFeedbacks('presenter_status')

		if (isNew) {
			this.updateActions()
			this.updateFeedbacks()
			this.updatePresets()
			this.updateVariableDefinitions()
			UpdateVariableValues(this)
		}
	}
}

function errorMessage(err: unknown): string {
	return err instanceof Error ? err.message : String(err)
}
