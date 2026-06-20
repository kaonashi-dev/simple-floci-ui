import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DisableRuleCommand, EnableRuleCommand, EventBridgeClient, ListEventBusesCommand, ListRulesCommand, ListTargetsByRuleCommand } from '@aws-sdk/client-eventbridge';
import { disableRule, enableRule, listEventBuses, listRules, listTargetsByRule } from '$lib/floci/eventbridge';

const ebMock = mockClient(EventBridgeClient);

describe('eventbridge service', () => {
	beforeEach(() => ebMock.reset());

	it('lists event buses and rules across pages', async () => {
		ebMock.on(ListEventBusesCommand).resolves({ EventBuses: [{ Name: 'default', Arn: 'arn' }] });
		ebMock
			.on(ListRulesCommand)
			.resolvesOnce({ Rules: [{ Name: 'rule-a', Arn: 'arn:r1', State: 'ENABLED' }], NextToken: 'next' })
			.resolvesOnce({ Rules: [{ Name: 'rule-b', EventPattern: '{}' }] });

		await expect(listEventBuses()).resolves.toEqual([{ name: 'default', arn: 'arn' }]);
		await expect(listRules('default')).resolves.toEqual([
			expect.objectContaining({ name: 'rule-a', arn: 'arn:r1', state: 'ENABLED' }),
			expect.objectContaining({ name: 'rule-b', eventPattern: '{}' })
		]);
	});

	it('lists targets and toggles rules', async () => {
		ebMock.on(ListTargetsByRuleCommand).resolves({ Targets: [{ Id: 'target-1', Arn: 'arn:t', Input: '{}' }] });
		ebMock.on(EnableRuleCommand).resolves({});
		ebMock.on(DisableRuleCommand).resolves({});

		await expect(listTargetsByRule('rule', 'default')).resolves.toEqual([{ id: 'target-1', arn: 'arn:t', input: '{}' }]);
		await enableRule('rule', 'default');
		await disableRule('rule', 'default');

		expect(ebMock.commandCalls(EnableRuleCommand)[0].args[0].input).toEqual({ Name: 'rule', EventBusName: 'default' });
		expect(ebMock.commandCalls(DisableRuleCommand)[0].args[0].input).toEqual({ Name: 'rule', EventBusName: 'default' });
	});
});
