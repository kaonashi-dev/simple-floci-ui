import {
	EventBridgeClient,
	ListEventBusesCommand,
	ListRulesCommand,
	ListTargetsByRuleCommand,
	EnableRuleCommand,
	DisableRuleCommand
} from '@aws-sdk/client-eventbridge';
import { makeClient, paginateAll } from './aws';
import type { EventBusSummary, EventRuleSummary, EventRuleTarget } from '$lib/types/eventbridge';

const eb = makeClient(EventBridgeClient);

export async function listEventBuses(): Promise<EventBusSummary[]> {
	const buses = await paginateAll((token) =>
		eb.send(new ListEventBusesCommand({ NextToken: token })).then((res) => ({
			items: res.EventBuses ?? [],
			nextToken: res.NextToken
		}))
	);
	return buses.map((b) => ({ name: b.Name!, arn: b.Arn! }));
}

export async function listRules(busName: string): Promise<EventRuleSummary[]> {
	const rules = await paginateAll((token) =>
		eb.send(new ListRulesCommand({ EventBusName: busName, NextToken: token })).then((res) => ({
			items: res.Rules ?? [],
			nextToken: res.NextToken
		}))
	);
	return rules.map((r) => ({
		name: r.Name!,
		arn: r.Arn,
		state: r.State,
		description: r.Description,
		scheduleExpression: r.ScheduleExpression,
		eventPattern: r.EventPattern
	}));
}

export async function listTargetsByRule(ruleName: string, busName: string): Promise<EventRuleTarget[]> {
	const res = await eb.send(new ListTargetsByRuleCommand({ Rule: ruleName, EventBusName: busName }));
	return (res.Targets ?? []).map((t) => ({ id: t.Id!, arn: t.Arn!, input: t.Input }));
}

export async function enableRule(ruleName: string, busName: string): Promise<void> {
	await eb.send(new EnableRuleCommand({ Name: ruleName, EventBusName: busName }));
}

export async function disableRule(ruleName: string, busName: string): Promise<void> {
	await eb.send(new DisableRuleCommand({ Name: ruleName, EventBusName: busName }));
}
