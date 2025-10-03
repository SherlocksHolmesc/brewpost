// src/services/nodeService.ts
// COMMENTED OUT: Backend services disabled for new branch
// import '../amplify-config';
// import { generateClient } from '@aws-amplify/api';
// import { listNodes, listEdges } from '../graphql/queries';
// import { createNode, updateNode, deleteNode, createEdge, deleteEdge } from '../graphql/mutations';
// import { onNodeCreated, onNodeUpdated, onNodeDeleted, onEdgeChanged } from '../graphql/subscriptions';

// const client = generateClient();

export type NodeDTO = {
  projectId: string;
  nodeId: string;
  title: string;
  description?: string | null;
  x?: number | null;
  y?: number | null;
  status?: string | null;
  contentId?: string | null;
  createdAt: string;
  updatedAt: string;
};


export const NodeAPI = {
  async list(projectId: string) {
    // COMMENTED OUT: Backend disabled
    console.log('[MOCK] Fetching nodes for project:', projectId);
    return [] as NodeDTO[];
    // try {
    //   console.log('Fetching nodes for project:', projectId);
    //   const response = await client.graphql({ query: listNodes, variables: { projectId } });
    //   console.log('List nodes response:', response);
    //   console.log('List nodes data:', (response as any).data.listNodes);
    //   return (response as any).data.listNodes as NodeDTO[];
    // } catch (error) {
    //   console.error('Error listing nodes:', error);
    //   throw error;
    // }
  },
  async create(input: {
    projectId: string; title: string; description?: string; x?: number; y?: number; status?: string; contentId?: string;
  }) { 
    // COMMENTED OUT: Backend disabled
    console.log('[MOCK] Creating node:', input);
    return { ...input, nodeId: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as NodeDTO;
    // try {
    //   console.log('Creating node:', input);
    //   const response = await client.graphql({ query: createNode, variables: { input } }); 
    //   console.log('Create node response:', response);
    //   console.log('Create node data:', (response as any).data.createNode);
    //   return (response as any).data.createNode as NodeDTO;
    // } catch (error) {
    //   console.error('Error creating node:', error);
    //   throw error;
    // }
  },
  async update(input: {
    projectId: string; nodeId: string; title?: string; description?: string; x?: number; y?: number; status?: string; contentId?: string;
  }) { 
    // COMMENTED OUT: Backend disabled
    console.log('[MOCK] Updating node:', input);
    return { ...input, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as NodeDTO;
    // try {
    //   console.log('Updating node:', input);
    //   const response = await client.graphql({ query: updateNode, variables: { input } }); 
    //   console.log('Update node response:', response);
    //   return (response as any).data.updateNode as NodeDTO;
    // } catch (error) {
    //   console.error('Error updating node:', error);
    //   if (error && typeof error === 'object' && 'errors' in error) {
    //     console.error('GraphQL errors:', (error as any).errors);
    //     (error as any).errors?.forEach((err: any, index: number) => {
    //       console.error(`Error ${index + 1}:`, err.message);
    //       if (err.locations) console.error('Locations:', err.locations);
    //       if (err.path) console.error('Path:', err.path);
    //     });
    //   }
    //   throw error;
    // }
  },
  async remove(projectId: string, nodeId: string) {
    // COMMENTED OUT: Backend disabled
    console.log('[MOCK] Deleting node:', { projectId, nodeId });
    return { data: { deleteNode: { projectId, nodeId } } };
    // try {
    //   console.log('Deleting node:', { projectId, nodeId });
    //   const response = await client.graphql({ query: deleteNode, variables: { projectId, nodeId } });
    //   console.log('Delete node response:', response);
    //   return response;
    // } catch (error) {
    //   console.error('Error deleting node:', error);
    //   if (error && typeof error === 'object' && 'errors' in error) {
    //     console.error('GraphQL errors:', (error as any).errors);
    //     const errors = (error as any).errors;
    //     let hasNullFieldErrors = false;
    //     errors?.forEach((err: any, index: number) => {
    //       console.error(`Error ${index + 1}:`, err.message);
    //       if (err.locations) console.error('Locations:', err.locations);
    //       if (err.path) console.error('Path:', err.path);
    //       if (err.message && err.message.includes('Cannot return null for non-nullable type')) {
    //         hasNullFieldErrors = true;
    //       }
    //     });
    //     if (hasNullFieldErrors && errors.length <= 3) {
    //       console.log('Deletion likely succeeded despite GraphQL schema issues');
    //       return { data: { deleteNode: { projectId, nodeId } } };
    //     }
    //   }
    //   throw error;
    // }
  },

  // Edges
  async listEdges(projectId: string) {
    // COMMENTED OUT: Backend disabled
    console.log('[MOCK] Fetching edges for project:', projectId);
    return [] as { edgeId:string; from:string; to:string }[];
    // try {
    //   console.log('Fetching edges for project:', projectId);
    //   const response = await client.graphql({ query: listEdges, variables: { projectId } });
    //   console.log('List edges response:', response);
    //   console.log('List edges data:', (response as any).data.listEdges);
    //   return (response as any).data.listEdges as { edgeId:string; from:string; to:string }[];
    // } catch (error) {
    //   console.error('Error listing edges:', error);
    //   throw error;
    // }
  },
  async createEdge(projectId: string, from: string, to: string, label?: string) {
    // COMMENTED OUT: Backend disabled
    console.log('[MOCK] Creating edge:', { projectId, from, to, label });
    return { edgeId: Date.now().toString(), from, to };
    // try {
    //   console.log('Creating edge:', { projectId, from, to, label });
    //   const response = await client.graphql({ query: createEdge, variables: { projectId, from, to, label } });
    //   console.log('Create edge response:', response);
    //   return (response as any).data.createEdge;
    // } catch (error) {
    //   console.error('Error creating edge:', error);
    //   throw error;
    // }
  },
  async deleteEdge(projectId: string, edgeId: string) {
    // COMMENTED OUT: Backend disabled
    console.log('[MOCK] Deleting edge:', { projectId, edgeId });
    return;
    // try {
    //   console.log('Deleting edge:', { projectId, edgeId });
    //   const response = await client.graphql({ query: deleteEdge, variables: { projectId, edgeId } });
    //   console.log('Delete edge response:', response);
    // } catch (error) {
    //   console.error('Error deleting edge:', error);
    //   throw error;
    // }
  },

  // Subs
  subscribe(projectId: string, onEvent: (evt: { type:'created'|'updated'|'deleted'|'edge'; payload: any }) => void) {
    // COMMENTED OUT: Backend disabled
    console.log('[MOCK] Subscriptions disabled for project:', projectId);
    return () => {};
    // if (!projectId) {
    //   console.error('ProjectId is required for subscriptions');
    //   return () => {};
    // }
    // if (import.meta.env.VITE_DISABLE_SUBSCRIPTIONS === 'true') {
    //   console.log('Subscriptions disabled via environment variable');
    //   return () => {};
    // }
    // console.log('Setting up subscriptions for project:', projectId);
    // const subs = [
    //   (client.graphql({ query: onNodeCreated, variables: { projectId } }) as any).subscribe({
    //     next: ({ data }: any) => {
    //       console.log('OnNodeCreated received:', data);
    //       if (data?.onNodeCreated) { onEvent({ type: 'created', payload: data.onNodeCreated }); }
    //     },
    //     error: (error: any) => { console.warn('OnNodeCreated subscription error:', error); },
    //   }),
    //   (client.graphql({ query: onNodeUpdated, variables: { projectId } }) as any).subscribe({
    //     next: ({ data }: any) => {
    //       console.log('OnNodeUpdated received:', data);
    //       if (data?.onNodeUpdated) { onEvent({ type: 'updated', payload: data.onNodeUpdated }); }
    //     },
    //     error: (error: any) => { console.warn('OnNodeUpdated subscription error:', error); },
    //   }),
    //   (client.graphql({ query: onNodeDeleted, variables: { projectId } }) as any).subscribe({
    //     next: ({ data }: any) => {
    //       console.log('OnNodeDeleted received:', data);
    //       if (data?.onNodeDeleted) { onEvent({ type: 'deleted', payload: data.onNodeDeleted }); }
    //     },
    //     error: (error: any) => { console.warn('OnNodeDeleted subscription error:', error); },
    //   }),
    //   (client.graphql({ query: onEdgeChanged, variables: { projectId } }) as any).subscribe({
    //     next: ({ data }: any) => {
    //       console.log('OnEdgeChanged received:', data);
    //       if (data?.onEdgeChanged) { onEvent({ type: 'edge', payload: data.onEdgeChanged }); }
    //     },
    //     error: (error: any) => { console.warn('OnEdgeChanged subscription error:', error); },
    //   }),
    // ];
    // return () => {
    //   console.log('Unsubscribing from all subscriptions');
    //   subs.forEach(s => s.unsubscribe());
    // };
  },
};