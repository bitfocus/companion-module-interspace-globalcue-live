import type { ModuleSchema } from './main.js'
import type ModuleInstance from './main.js'
import {
	combineRgb,
	ButtonGraphicsDecorationType,
	type ButtonGraphicsBoxElement,
	type ButtonGraphicsTextElement,
	type CompanionButtonStepActions,
	type CompanionPresetDefinitions,
	type CompanionPresetGroupSimple,
	type CompanionPresetSection,
	type CompanionSimplePresetDefinition,
	type CompanionLayeredButtonPresetDefinition,
	type SomeButtonGraphicsElement,
} from '@companion-module/base'

const IDLE_GREY = combineRgb(110, 110, 110)
const IDLE_ORANGE = combineRgb(204, 101, 0)
const IDLE_BLACK = combineRgb(0, 0, 0)
const IDLE_DARK_GREEN = combineRgb(0, 102, 0)
const ACTIVE_GREEN = combineRgb(0, 153, 0)
const SOLO_GREEN = combineRgb(64, 255, 64)
const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)

function box(color: number): ButtonGraphicsBoxElement {
	return { id: 'box0', type: 'box', x: 0, y: 0, width: 100, height: 100, color }
}

function text(
	id: string,
	value: string,
	color: number,
	fontsize: number,
	y = 0,
	height = 100,
): ButtonGraphicsTextElement {
	return {
		id,
		type: 'text',
		x: 0,
		y,
		width: 100,
		height,
		text: value,
		color,
		halign: 'center',
		valign: 'center',
		fontsize,
		fontsizeAllowShrink: true,
	}
}

/** Wrap a "simple" preset and an equivalent element-based "layered" preset as alternatives, so Companion picks whichever it supports. */
function withLayeredAlternative(
	simpleDef: CompanionSimplePresetDefinition<ModuleSchema>,
	elements: SomeButtonGraphicsElement[],
	layeredFeedbacks: CompanionLayeredButtonPresetDefinition<ModuleSchema>['feedbacks'],
): {
	type: 'alternatives'
	variants: [CompanionLayeredButtonPresetDefinition<ModuleSchema>, CompanionSimplePresetDefinition<ModuleSchema>]
} {
	const layeredDef: CompanionLayeredButtonPresetDefinition<ModuleSchema> = {
		type: 'layered',
		name: simpleDef.name,
		canvas: { decoration: ButtonGraphicsDecorationType.Border },
		elements,
		steps: simpleDef.steps,
		feedbacks: layeredFeedbacks,
	}
	return { type: 'alternatives', variants: [layeredDef, simpleDef] }
}

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions<ModuleSchema> = {}
	const presenterGroupIds: string[] = []

	self.presenterOrder.forEach((presenterId, index) => {
		const n = index + 1
		const state = self.presenters.get(presenterId)
		const presenterLabel = state?.name ?? presenterId
		const nameVariable = `$(${self.label}:presenter${n}_name)`
		const safeKey = presenterId.replace(/[^a-zA-Z0-9]+/g, '_')
		const groupId = `presenter_${safeKey}`
		presenterGroupIds.push(groupId)

		const noActionSteps: CompanionButtonStepActions<ModuleSchema>[] = [{ down: [], up: [] }]
		const cueSteps = (cue: 'forward' | 'back' | 'black'): CompanionButtonStepActions<ModuleSchema>[] => [
			{ down: [{ actionId: 'send_cue', options: { presenter: presenterId, cue } }], up: [] },
		]
		const controlSteps = (
			control: 'pause' | 'play' | 'solo' | 'toggle',
		): CompanionButtonStepActions<ModuleSchema>[] => [
			{ down: [{ actionId: 'presenter_control', options: { presenter: presenterId, control } }], up: [] },
		]

		const nameSimple: CompanionSimplePresetDefinition<ModuleSchema> = {
			type: 'simple',
			name: `${presenterLabel}: Name`,
			style: { text: nameVariable, size: 'auto', color: WHITE, bgcolor: BLACK },
			steps: noActionSteps,
			feedbacks: [
				{
					feedbackId: 'presenter_status',
					options: { presenter: presenterId, status: 'play' },
					style: { bgcolor: ACTIVE_GREEN, color: WHITE },
				},
			],
		}
		presets[`${groupId}_name`] = withLayeredAlternative(
			nameSimple,
			[box(BLACK), text('text0', nameVariable, WHITE, 30)],
			[
				{
					feedbackId: 'presenter_status',
					options: { presenter: presenterId, status: 'play' },
					styleOverrides: [
						{ elementId: 'text0', elementProperty: 'color', override: WHITE },
						{ elementId: 'box0', elementProperty: 'color', override: ACTIVE_GREEN },
					],
				},
			],
		)

		const cuePreset = (
			key: 'next' | 'back' | 'black',
			cue: 'forward' | 'back' | 'black',
			label: string,
			idleColor: number,
		): void => {
			const simpleDef: CompanionSimplePresetDefinition<ModuleSchema> = {
				type: 'simple',
				name: `${presenterLabel}: ${label[0]}${label.slice(1).toLowerCase()}`,
				style: { text: `${label}\\n${nameVariable}`, size: 'auto', color: WHITE, bgcolor: idleColor },
				steps: cueSteps(cue),
				feedbacks: [],
			}
			presets[`${groupId}_${key}`] = withLayeredAlternative(
				simpleDef,
				[box(idleColor), text('name0', nameVariable, WHITE, 100, 77.6, 22.4), text('text0', label, WHITE, 35, 3, 97)],
				[],
			)
		}
		cuePreset('next', 'forward', 'NEXT', IDLE_BLACK)
		cuePreset('back', 'back', 'BACK', IDLE_DARK_GREEN)
		cuePreset('black', 'black', 'BLACK', IDLE_BLACK)

		const soloSimple: CompanionSimplePresetDefinition<ModuleSchema> = {
			type: 'simple',
			name: `${presenterLabel}: Solo`,
			style: { text: '👤', size: 'auto', color: BLACK, bgcolor: IDLE_ORANGE },
			steps: controlSteps('solo'),
			feedbacks: [
				{
					feedbackId: 'presenter_status',
					options: { presenter: presenterId, status: 'play' },
					style: { bgcolor: ACTIVE_GREEN, color: WHITE },
				},
				{
					feedbackId: 'presenter_status',
					options: { presenter: presenterId, status: 'solo' },
					style: { bgcolor: SOLO_GREEN, color: WHITE },
				},
			],
		}
		presets[`${groupId}_solo`] = withLayeredAlternative(
			soloSimple,
			[box(IDLE_ORANGE), text('text0', '👤', BLACK, 100)],
			[
				{
					feedbackId: 'presenter_status',
					options: { presenter: presenterId, status: 'play' },
					styleOverrides: [
						{ elementId: 'text0', elementProperty: 'color', override: WHITE },
						{ elementId: 'box0', elementProperty: 'color', override: ACTIVE_GREEN },
					],
				},
				{
					feedbackId: 'presenter_status',
					options: { presenter: presenterId, status: 'solo' },
					styleOverrides: [
						{ elementId: 'text0', elementProperty: 'color', override: WHITE },
						{ elementId: 'box0', elementProperty: 'color', override: SOLO_GREEN },
					],
				},
			],
		)

		const playSimple: CompanionSimplePresetDefinition<ModuleSchema> = {
			type: 'simple',
			name: `${presenterLabel}: Play`,
			style: { text: '▶', size: 'auto', color: BLACK, bgcolor: IDLE_GREY },
			steps: controlSteps('play'),
			feedbacks: [
				{
					feedbackId: 'presenter_status',
					options: { presenter: presenterId, status: 'play' },
					style: { bgcolor: ACTIVE_GREEN, color: WHITE },
				},
			],
		}
		presets[`${groupId}_play`] = withLayeredAlternative(
			playSimple,
			[box(IDLE_GREY), text('text0', '▶', BLACK, 100)],
			[
				{
					feedbackId: 'presenter_status',
					options: { presenter: presenterId, status: 'play' },
					styleOverrides: [
						{ elementId: 'text0', elementProperty: 'color', override: WHITE },
						{ elementId: 'box0', elementProperty: 'color', override: ACTIVE_GREEN },
					],
				},
			],
		)

		const toggleSimple: CompanionSimplePresetDefinition<ModuleSchema> = {
			type: 'simple',
			name: `${presenterLabel}: Toggle Pause/Play`,
			style: { text: '⏯️', size: 'auto', color: BLACK, bgcolor: IDLE_GREY },
			steps: controlSteps('toggle'),
			feedbacks: [
				{
					feedbackId: 'presenter_status',
					options: { presenter: presenterId, status: 'play' },
					style: { bgcolor: ACTIVE_GREEN, color: WHITE },
				},
			],
		}
		presets[`${groupId}_toggle`] = withLayeredAlternative(
			toggleSimple,
			[box(IDLE_GREY), text('text0', '⏯️', BLACK, 100)],
			[
				{
					feedbackId: 'presenter_status',
					options: { presenter: presenterId, status: 'play' },
					styleOverrides: [
						{ elementId: 'text0', elementProperty: 'color', override: WHITE },
						{ elementId: 'box0', elementProperty: 'color', override: ACTIVE_GREEN },
					],
				},
			],
		)

		const pauseSimple: CompanionSimplePresetDefinition<ModuleSchema> = {
			type: 'simple',
			name: `${presenterLabel}: Pause`,
			style: { text: '⏸', size: 'auto', color: BLACK, bgcolor: IDLE_GREY },
			steps: controlSteps('pause'),
			feedbacks: [
				{
					feedbackId: 'presenter_status',
					options: { presenter: presenterId, status: 'pause' },
					style: { bgcolor: ACTIVE_GREEN, color: WHITE },
				},
			],
		}
		presets[`${groupId}_pause`] = withLayeredAlternative(
			pauseSimple,
			[box(IDLE_GREY), text('text0', '⏸', BLACK, 100)],
			[
				{
					feedbackId: 'presenter_status',
					options: { presenter: presenterId, status: 'pause' },
					styleOverrides: [
						{ elementId: 'text0', elementProperty: 'color', override: WHITE },
						{ elementId: 'box0', elementProperty: 'color', override: ACTIVE_GREEN },
					],
				},
			],
		)
	})

	const structure: CompanionPresetSection[] = [
		{
			id: 'presenters',
			name: 'GlobalCue Live',
			description:
				'One group of buttons per known presenter (Name / Next / Back / Black / Solo / Play / Toggle / Pause)',
			definitions: presenterGroupIds.map((groupId, index): CompanionPresetGroupSimple => {
				const presenterId = self.presenterOrder[index]
				const presenterLabel = self.presenters.get(presenterId)?.name ?? presenterId
				return {
					id: groupId,
					type: 'simple',
					name: `Presenter ${index + 1} - ${presenterLabel} (${presenterId})`,
					presets: [
						`${groupId}_name`,
						`${groupId}_next`,
						`${groupId}_back`,
						`${groupId}_black`,
						`${groupId}_solo`,
						`${groupId}_play`,
						`${groupId}_toggle`,
						`${groupId}_pause`,
					],
				}
			}),
		},
	]

	self.setPresetDefinitions(structure, presets)
}
