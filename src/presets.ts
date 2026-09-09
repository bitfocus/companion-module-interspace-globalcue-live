import type { ModuleSchema } from './main.js'
import type ModuleInstance from './main.js'
import {
	combineRgb,
	type CompanionPresetDefinitions,
	type CompanionPresetGroupSimple,
	type CompanionPresetSection,
} from '@companion-module/base'

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions<ModuleSchema> = {}
	const presenterGroupIds: string[] = []

	for (const presenterId of self.presenterOrder) {
		const state = self.presenters.get(presenterId)
		const presenterLabel = state?.name ?? presenterId
		const safeKey = presenterId.replace(/[^a-zA-Z0-9]+/g, '_')
		const groupId = `presenter_${safeKey}`
		presenterGroupIds.push(groupId)

		presets[`${groupId}_forward`] = {
			type: 'simple',
			name: `${presenterLabel}: Forward`,
			style: {
				text: `${presenterLabel}\\nForward`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 102, 204),
			},
			steps: [{ down: [{ actionId: 'send_cue', options: { presenter: presenterId, cue: 'forward' } }], up: [] }],
			feedbacks: [],
		}
		presets[`${groupId}_back`] = {
			type: 'simple',
			name: `${presenterLabel}: Back`,
			style: {
				text: `${presenterLabel}\\nBack`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(204, 102, 0),
			},
			steps: [{ down: [{ actionId: 'send_cue', options: { presenter: presenterId, cue: 'back' } }], up: [] }],
			feedbacks: [],
		}
		presets[`${groupId}_black`] = {
			type: 'simple',
			name: `${presenterLabel}: Black`,
			style: {
				text: `${presenterLabel}\\nBlack`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [{ down: [{ actionId: 'send_cue', options: { presenter: presenterId, cue: 'black' } }], up: [] }],
			feedbacks: [],
		}
		presets[`${groupId}_toggle_pause`] = {
			type: 'simple',
			name: `${presenterLabel}: Toggle Pause/Play`,
			style: {
				text: `${presenterLabel}\\nPause`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(51, 51, 51),
			},
			steps: [{ down: [{ actionId: 'toggle_pause', options: { presenter: presenterId } }], up: [] }],
			feedbacks: [
				{
					feedbackId: 'presenter_status',
					options: { presenter: presenterId, status: 'pause' },
					style: { bgcolor: combineRgb(204, 0, 0) },
				},
			],
		}
		presets[`${groupId}_solo`] = {
			type: 'simple',
			name: `${presenterLabel}: Solo`,
			style: {
				text: `${presenterLabel}\\nSolo`,
				size: 'auto',
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(102, 102, 102),
			},
			steps: [
				{ down: [{ actionId: 'presenter_control', options: { presenter: presenterId, control: 'solo' } }], up: [] },
			],
			feedbacks: [
				{
					feedbackId: 'presenter_status',
					options: { presenter: presenterId, status: 'solo' },
					style: { bgcolor: combineRgb(255, 204, 0) },
				},
			],
		}
	}

	const structure: CompanionPresetSection[] = [
		{
			id: 'presenters',
			name: 'Presenters',
			description: 'One group of buttons per known presenter (Forward / Back / Black / Pause-Play / Solo)',
			definitions: presenterGroupIds.map((groupId): CompanionPresetGroupSimple => ({
				id: groupId,
				type: 'simple',
				name: groupId,
				presets: [
					`${groupId}_forward`,
					`${groupId}_back`,
					`${groupId}_black`,
					`${groupId}_toggle_pause`,
					`${groupId}_solo`,
				],
			})),
		},
	]

	self.setPresetDefinitions(structure, presets)
}
