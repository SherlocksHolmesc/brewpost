// src/amplify-config.ts
import { Amplify } from 'aws-amplify';

Amplify.configure({
  API: {
    GraphQL: {
      endpoint: 'https://uvcku4cipfcz7kttgwex7xjjmu.appsync-api.us-east-1.amazonaws.com/graphql',
      region: 'us-east-1',
      defaultAuthMode: 'apiKey',
      apiKey: import.meta.env.VITE_APPSYNC_API_KEY ?? 'da2-mki4c*********************', // move to env
    },
  },
});
