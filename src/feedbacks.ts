import { combineRgb } from '@companion-module/base'
import type ModuleInstance from './main.js'
import type { ControlName } from './api.js'

export type FeedbacksSchema = {
	presenter_status: {
		type: 'boolean'
		options: {
			presenter: string
			status: ControlName
		}
	}
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	const presenterChoices = self.getPresenterChoices()
	const defaultPresenter = presenterChoices[0]?.id ?? ''

	self.setFeedbackDefinitions({
		presenter_status: {
			type: 'boolean',
			name: 'Presenter Status (Paused / Playing / Solo)',
			description:
				'Only reports live state for presenters that GlobalCue is actively polling (session-discovered, or manually configured in the connection settings).',
			defaultStyle: {
				bgcolor: combineRgb(0, 153, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'presenter',
					type: 'dropdown',
					label: 'Presenter',
					choices: presenterChoices,
					default: defaultPresenter,
					allowCustom: true,
				},
				{
					id: 'status',
					type: 'dropdown',
					label: 'Status',
					choices: [
						{ id: 'pause', label: 'Paused' },
						{ id: 'play', label: 'Playing' },
						{ id: 'solo', label: 'Solo' },
					],
					default: 'play',
				},
			],
			callback: (feedback) => {
				const state = self.presenters.get(String(feedback.options.presenter).trim())
				if (!state) return false
				return !!state[feedback.options.status]
			},
		},
	})
}
