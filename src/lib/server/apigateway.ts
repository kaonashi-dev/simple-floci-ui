import { APIGatewayClient, GetRestApisCommand, GetResourcesCommand, GetStagesCommand } from '@aws-sdk/client-api-gateway';
import { ApiGatewayV2Client, GetApisCommand, GetRoutesCommand } from '@aws-sdk/client-apigatewayv2';
import { awsConfig } from './aws';
import type { RestApiSummary, RestApiResource, RestApiStage, HttpApiSummary, HttpApiRoute } from '$lib/types/apigateway';

function restClient() { return new APIGatewayClient(awsConfig); }
function httpClient() { return new ApiGatewayV2Client(awsConfig); }

export async function listRestApis(): Promise<RestApiSummary[]> {
  const c = restClient();
  const res = await c.send(new GetRestApisCommand({ limit: 500 }));
  return (res.items ?? []).map(a => ({
    id: a.id!,
    name: a.name!,
    description: a.description,
    createdDate: a.createdDate?.toISOString(),
    endpointType: a.endpointConfiguration?.types?.[0]
  }));
}

export async function getRestApiResources(id: string): Promise<RestApiResource[]> {
  const c = restClient();
  const res = await c.send(new GetResourcesCommand({ restApiId: id, limit: 500 }));
  return (res.items ?? []).map(r => ({
    id: r.id!,
    path: r.path ?? '/',
    methods: Object.keys(r.resourceMethods ?? {})
  }));
}

export async function getRestApiStages(id: string): Promise<RestApiStage[]> {
  const c = restClient();
  const res = await c.send(new GetStagesCommand({ restApiId: id }));
  return (res.item ?? []).map(s => ({
    name: s.stageName!,
    deploymentId: s.deploymentId,
    createdDate: s.createdDate?.toISOString(),
    lastUpdatedDate: s.lastUpdatedDate?.toISOString()
  }));
}

export async function listHttpApis(): Promise<HttpApiSummary[]> {
  const c = httpClient();
  const res = await c.send(new GetApisCommand({}));
  return (res.Items ?? []).map(a => ({
    id: a.ApiId!,
    name: a.Name!,
    protocolType: a.ProtocolType,
    createdDate: a.CreatedDate?.toISOString(),
    apiEndpoint: a.ApiEndpoint
  }));
}

export async function getHttpApiRoutes(id: string): Promise<HttpApiRoute[]> {
  const c = httpClient();
  const res = await c.send(new GetRoutesCommand({ ApiId: id }));
  return (res.Items ?? []).map(r => ({
    routeId: r.RouteId!,
    routeKey: r.RouteKey!,
    target: r.Target
  }));
}
