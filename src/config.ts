import type { SomeCompanionConfigField } from '@companion-module/base'

export const MAX_MANUAL_PRESENTERS = 8

export type ModuleConfig = {
	sessionId: string
	presenterCount: number
	presenter1Id: string
	presenter1Name: string
	presenter2Id: string
	presenter2Name: string
	presenter3Id: string
	presenter3Name: string
	presenter4Id: string
	presenter4Name: string
	presenter5Id: string
	presenter5Name: string
	presenter6Id: string
	presenter6Name: string
	presenter7Id: string
	presenter7Name: string
	presenter8Id: string
	presenter8Name: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	const fields: SomeCompanionConfigField[] = [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'GlobalCue Live',
			value:
				'Controls presenters on the free Interspace GlobalCue Live cue-light service (globalcue.live). Either enter a Session ID below to automatically discover every presenter in that session, or leave it blank and enter individual Presenter IDs manually.',
		},
		{
			type: 'textinput',
			id: 'sessionId',
			label: 'Session ID (optional - enables automatic presenter discovery)',
			width: 12,
			default: '',
			disableAutoExpression: true,
		},
		{
			type: 'number',
			id: 'presenterCount',
			label: 'Number of manually configured presenters',
			width: 6,
			min: 1,
			max: MAX_MANUAL_PRESENTERS,
			default: 1,
			isVisibleExpression: '!$(options:sessionId)',
			disableAutoExpression: true,
		},
	]

	for (let i = 1; i <= MAX_MANUAL_PRESENTERS; i++) {
		fields.push(
			{
				type: 'textinput',
				id: `presenter${i}Id`,
				label: `Presenter ${i} ID`,
				tooltip: 'Found at the end of the presenter link, e.g. 123-456-7890',
				width: 6,
				default: '',
				isVisibleExpression: `!$(options:sessionId) && $(options:presenterCount) >= ${i}`,
			},
			{
				type: 'textinput',
				id: `presenter${i}Name`,
				label: `Presenter ${i} Name`,
				width: 6,
				default: '',
				isVisibleExpression: `!$(options:sessionId) && $(options:presenterCount) >= ${i}`,
			},
		)
	}

	return fields
}
