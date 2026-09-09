import type ModuleInstance from './main.js'

export type VariablesSchema = Record<string, string>

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const defs: Record<string, { name: string }> = {
		presenter_count: { name: 'Number of known presenters' },
	}

	self.presenterOrder.forEach((_id, index) => {
		const n = index + 1
		defs[`presenter${n}_id`] = { name: `Presenter ${n}: ID` }
		defs[`presenter${n}_name`] = { name: `Presenter ${n}: Name` }
		defs[`presenter${n}_pause`] = { name: `Presenter ${n}: Paused` }
		defs[`presenter${n}_play`] = { name: `Presenter ${n}: Playing` }
		defs[`presenter${n}_solo`] = { name: `Presenter ${n}: Solo` }
		defs[`presenter${n}_active_handsets`] = { name: `Presenter ${n}: Active handset count` }
	})

	self.setVariableDefinitions(defs)
}

/** Push current values to Companion. Pass a presenterId to only refresh that one presenter's variables. */
export function UpdateVariableValues(self: ModuleInstance, presenterId?: string): void {
	const values: Record<string, string> = {
		presenter_count: String(self.presenterOrder.length),
	}

	const ids = presenterId ? [presenterId] : self.presenterOrder
	for (const id of ids) {
		const index = self.presenterOrder.indexOf(id)
		if (index === -1) continue
		const n = index + 1
		const state = self.presenters.get(id)
		values[`presenter${n}_id`] = id
		values[`presenter${n}_name`] = state?.name ?? id
		values[`presenter${n}_pause`] = state?.pause ? 'Yes' : 'No'
		values[`presenter${n}_play`] = state?.play ? 'Yes' : 'No'
		values[`presenter${n}_solo`] = state?.solo ? 'Yes' : 'No'
		values[`presenter${n}_active_handsets`] = String(state?.activeHandsetCount ?? 0)
	}

	self.setVariableValues(values)
}
