import type ModuleInstance from './main.js'
import type { CueName, ControlName } from './api.js'

export type ActionsSchema = {
	send_cue: {
		options: {
			presenter: string
			cue: CueName
		}
	}
	presenter_control: {
		options: {
			presenter: string
			control: ControlName | 'toggle'
		}
	}
}

export function UpdateActions(self: ModuleInstance): void {
	const presenterChoices = self.getPresenterChoices()
	const defaultPresenter = presenterChoices[0]?.id ?? ''

	self.setActionDefinitions({
		send_cue: {
			name: 'Send Cue (Forward / Back / Black)',
			options: [
				{
					id: 'presenter',
					type: 'dropdown',
					label: 'Presenter',
					tooltip: 'Choose a known presenter, or type/paste a presenter ID',
					choices: presenterChoices,
					default: defaultPresenter,
					allowCustom: true,
				},
				{
					id: 'cue',
					type: 'dropdown',
					label: 'Cue',
					choices: [
						{ id: 'forward', label: 'Forward' },
						{ id: 'back', label: 'Back' },
						{ id: 'black', label: 'Black' },
					],
					default: 'forward',
				},
			],
			callback: async (event) => {
				await self.sendCommand(String(event.options.presenter), event.options.cue)
			},
		},
		presenter_control: {
			name: 'Presenter Control (Pause / Play / Solo / Toggle)',
			options: [
				{
					id: 'presenter',
					type: 'dropdown',
					label: 'Presenter',
					tooltip: 'Choose a known presenter, or type/paste a presenter ID',
					choices: presenterChoices,
					default: defaultPresenter,
					allowCustom: true,
				},
				{
					id: 'control',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'pause', label: 'Pause' },
						{ id: 'play', label: 'Play (Resume)' },
						{ id: 'solo', label: 'Solo' },
						{ id: 'toggle', label: 'Toggle Pause/Play' },
					],
					default: 'pause',
				},
			],
			callback: async (event) => {
				const presenter = String(event.options.presenter)
				if (event.options.control === 'toggle') {
					await self.togglePause(presenter)
				} else {
					await self.sendCommand(presenter, event.options.control)
				}
			},
		},
	})
}
