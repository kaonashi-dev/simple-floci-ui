import {
	EventBridgeClient,
	ListEventBusesCommand,
	ListRulesCommand,
	ListTargetsByRuleCommand,
	EnableRuleCommand,
	DisableRuleCommand
} from '@aws-sdk/client-eventbridge';
import { awsConfig } from './aws';
import type { EventBusSummary, EventRuleSummary, EventRuleTarget } from '$lib/types/eventbridge';

function client() {
	return new EventBridgeClient(awsConfig);
}

export async function listEventBuses(): Promise<EventBusSummary[]> {
	const eb = client();
	const buses = [];
	let nextToken: string | undefined;
	do {
		const res = await eb.send(new ListEventBusesCommand({ NextToken: nextToken }));
		if (res.EventBuses) buses.push(...res.EventBuses);
		nextToken = res.NextToken;
	} while (nextToken);
	return buses.map((b) => ({ name: b.Name!, arn: b.Arn! }));
}

export async function listRules(busName: string): Promise<EventRuleSummary[]> {
	const eb = client();
	const rules = [];
	let nextToken: string | undefined;
	do {
		const res = await eb.send(new ListRulesCommand({ EventBusName: busName, NextToken: nextToken }));
		if (res.Rules) rules.push(...res.Rules);
		nextToken = res.NextToken;
	} while (nextToken);
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
	const eb = client();
	const res = await eb.send(new ListTargetsByRuleCommand({ Rule: ruleName, EventBusName: busName }));
	return (res.Targets ?? []).map((t) => ({ id: t.Id!, arn: t.Arn!, input: t.Input }));
}

export async function enableRule(ruleName: string, busName: string): Promise<void> {
	const eb = client();
	await eb.send(new EnableRuleCommand({ Name: ruleName, EventBusName: busName }));
}

export async function disableRule(ruleName: string, busName: string): Promise<void> {
	const eb = client();
	await eb.send(new DisableRuleCommand({ Name: ruleName, EventBusName: busName }));
}
