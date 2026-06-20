import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { APIGatewayClient, GetResourcesCommand, GetRestApisCommand, GetStagesCommand } from '@aws-sdk/client-api-gateway';
import { ApiGatewayV2Client, GetApisCommand, GetRoutesCommand } from '@aws-sdk/client-apigatewayv2';
import { getHttpApiRoutes, getRestApiResources, getRestApiStages, listHttpApis, listRestApis } from '$lib/floci/apigateway';

const restMock = mockClient(APIGatewayClient);
const httpMock = mockClient(ApiGatewayV2Client);

describe('api gateway service', () => {
	beforeEach(() => {
		restMock.reset();
		httpMock.reset();
	});

	it('maps REST APIs, resources, and stages', async () => {
		restMock.on(GetRestApisCommand).resolves({ items: [{ id: 'api', name: 'API', createdDate: new Date('2026-01-01T00:00:00Z'), endpointConfiguration: { types: ['REGIONAL'] } }] });
		restMock.on(GetResourcesCommand).resolves({ items: [{ id: 'res', path: '/orders', resourceMethods: { GET: {}, POST: {} } }] });
		restMock.on(GetStagesCommand).resolves({ item: [{ stageName: 'dev', deploymentId: 'dep', lastUpdatedDate: new Date('2026-01-02T00:00:00Z') }] });

		await expect(listRestApis()).resolves.toEqual([{ id: 'api', name: 'API', description: undefined, createdDate: '2026-01-01T00:00:00.000Z', endpointType: 'REGIONAL' }]);
		await expect(getRestApiResources('api')).resolves.toEqual([{ id: 'res', path: '/orders', methods: ['GET', 'POST'] }]);
		await expect(getRestApiStages('api')).resolves.toEqual([{ name: 'dev', deploymentId: 'dep', createdDate: undefined, lastUpdatedDate: '2026-01-02T00:00:00.000Z' }]);
	});

	it('maps HTTP APIs and routes', async () => {
		httpMock.on(GetApisCommand).resolves({ Items: [{ ApiId: 'api', Name: 'HTTP', ProtocolType: 'HTTP', RouteSelectionExpression: '$request.method $request.path', CreatedDate: new Date('2026-01-01T00:00:00Z'), ApiEndpoint: 'https://api' }] });
		httpMock.on(GetRoutesCommand).resolves({ Items: [{ RouteId: 'route', RouteKey: 'GET /orders', Target: 'integrations/x' }] });

		await expect(listHttpApis()).resolves.toEqual([{ id: 'api', name: 'HTTP', protocolType: 'HTTP', createdDate: '2026-01-01T00:00:00.000Z', apiEndpoint: 'https://api' }]);
		await expect(getHttpApiRoutes('api')).resolves.toEqual([{ routeId: 'route', routeKey: 'GET /orders', target: 'integrations/x' }]);
	});
});
