export type RestApiSummary = {
  id: string;
  name: string;
  description?: string;
  createdDate?: string;
  endpointType?: string;
};

export type RestApiResource = {
  id: string;
  path: string;
  methods: string[];
};

export type RestApiStage = {
  name: string;
  deploymentId?: string;
  createdDate?: string;
  lastUpdatedDate?: string;
};

export type HttpApiSummary = {
  id: string;
  name: string;
  protocolType?: string;
  createdDate?: string;
  apiEndpoint?: string;
};

export type HttpApiRoute = {
  routeId: string;
  routeKey: string;
  target?: string;
};
