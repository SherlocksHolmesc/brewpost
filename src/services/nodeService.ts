// src/services/nodeService.ts
import '../amplify-config';
import { generateClient } from '@aws-amplify/api';
import { listNodes, listEdges } from '../graphql/queries.ts';
import { createNode, updateNode, deleteNode, createEdge, deleteEdge } from '../graphql/mutations.ts';
// import { onNodeCreated, onNodeUpdated, onNodeDeleted, onEdgeChanged } from '../graphql/subscriptions.js';

const client = generateClient();
const baseUrl = import.meta.env.VITE_BACKEND_URL || '';

export type NodeDTO = {
  id: string;
  projectId: string;
  nodeId: string;
  title: string;
  description?: string | null;
  x?: number | null;
  y?: number | null;
  status?: string | null;
  contentId?: string | null;
  type?: string | null;
  day?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  imagePrompt?: string | null;
  scheduledDate?: string | null;
  createdAt: string;
  updatedAt: string;
};


export const NodeAPI = {
  async uploadImage(file: File): Promise<{ url: string }> {
    const endpoint = `${baseUrl}/api/upload-image`;
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    return response.json();
  },
  async list(projectId: string) {
    try {
      console.log('Fetching nodes for project:', projectId);
      const response = await client.graphql({ query: listNodes, variables: { filter: { projectId: { eq: projectId } } } });
      console.log('List nodes response:', response);
      const items = (response as any).data.listNodes.items || [];
      console.log('List nodes data:', items);
      return items as NodeDTO[];
    } catch (error) {
      console.error('Error listing nodes:', error);
      throw error;
    }
  },
  async create(input: {
    projectId: string; title: string; description?: string; x?: number; y?: number; status?: string; contentId?: string;
    type?: string; day?: string; imageUrl?: string; imageUrls?: string[]; imagePrompt?: string; scheduledDate?: string;
  }) { 
    try {
      console.log('Creating node:', input);
      const nodeInput = {
        projectId: input.projectId,
        nodeId: `node-${Date.now()}`, // Generate unique nodeId
        title: input.title,
        description: input.description,
        x: input.x,
        y: input.y,
        status: input.status,
        contentId: input.contentId,
        type: input.type,
        day: input.day,
        imageUrl: input.imageUrl,
        imageUrls: input.imageUrls,
        imagePrompt: input.imagePrompt,
        scheduledDate: input.scheduledDate
      };
      const response = await client.graphql({ query: createNode, variables: { input: nodeInput } }); 
      console.log('Create node response:', response);
      console.log('Create node data:', (response as any).data.createNode);
      return (response as any).data.createNode as NodeDTO;
    } catch (error) {
      console.error('Error creating node:', error);
      throw error;
    }
  },
  async update(input: {
    id?: string; projectId: string; nodeId: string; title?: string; description?: string; x?: number; y?: number; status?: string; contentId?: string;
    type?: string; day?: string; imageUrl?: string; imageUrls?: string[]; imagePrompt?: string; scheduledDate?: string;
  }) { 
    try {
      console.log('Updating node:', input);
      // If no id provided, try to find the node first
      let updateInput = input;
      if (!input.id) {
        const listResponse = await client.graphql({ query: listNodes, variables: { filter: { projectId: { eq: input.projectId }, nodeId: { eq: input.nodeId } } } });
        const items = (listResponse as any).data.listNodes.items || [];
        if (items.length > 0) {
          updateInput = { ...input, id: items[0].id };
        } else {
          throw new Error(`Node not found: ${input.nodeId}`);
        }
      }
      const response = await client.graphql({ query: updateNode, variables: { input: updateInput } }); 
      console.log('Update node response:', response);
      return (response as any).data.updateNode as NodeDTO;
    } catch (error) {
      console.error('Error updating node:', error);
      if (error && typeof error === 'object' && 'errors' in error) {
        console.error('GraphQL errors:', (error as any).errors);
        (error as any).errors?.forEach((err: any, index: number) => {
          console.error(`Error ${index + 1}:`, err.message);
          if (err.locations) console.error('Locations:', err.locations);
          if (err.path) console.error('Path:', err.path);
        });
      }
      throw error;
    }
  },
  async remove(projectId: string, nodeId: string) {
    try {
      console.log('Deleting node:', { projectId, nodeId });
      // Find the node first to get the database id
      const listResponse = await client.graphql({ query: listNodes, variables: { filter: { projectId: { eq: projectId }, nodeId: { eq: nodeId } } } });
      const items = (listResponse as any).data.listNodes.items || [];
      
      if (items.length === 0) {
        throw new Error(`Node not found: ${nodeId}`);
      }
      
      const nodeToDelete = items[0];
      const response = await client.graphql({ query: deleteNode, variables: { input: { id: nodeToDelete.id } } });
      console.log('Delete node response:', response);
      return response;
    } catch (error) {
      console.error('Error deleting node:', error);
      if (error && typeof error === 'object' && 'errors' in error) {
        console.error('GraphQL errors:', (error as any).errors);
        const errors = (error as any).errors;
        let hasNullFieldErrors = false;
        errors?.forEach((err: any, index: number) => {
          console.error(`Error ${index + 1}:`, err.message);
          if (err.locations) console.error('Locations:', err.locations);
          if (err.path) console.error('Path:', err.path);
          if (err.message && err.message.includes('Cannot return null for non-nullable type')) {
            hasNullFieldErrors = true;
          }
        });
        if (hasNullFieldErrors && errors.length <= 3) {
          console.log('Deletion likely succeeded despite GraphQL schema issues');
          return { data: { deleteNode: { projectId, nodeId } } };
        }
      }
      throw error;
    }
  },

  // Edges
  async listEdges(projectId: string) {
    try {
      console.log('Fetching edges for project:', projectId);
      const response = await client.graphql({ query: listEdges, variables: { filter: { projectId: { eq: projectId } } } });
      console.log('List edges response:', response);
      const items = (response as any).data.listEdges.items || [];
      console.log('List edges data:', items);
      return items as { edgeId:string; from:string; to:string }[];
    } catch (error) {
      console.error('Error listing edges:', error);
      throw error;
    }
  },
  async createEdge(projectId: string, from: string, to: string, label?: string) {
    try {
      console.log('Creating edge:', { projectId, from, to, label });
      
      // Check if edge already exists in either direction
      const existingResponse = await client.graphql({ query: listEdges, variables: { filter: { 
        projectId: { eq: projectId },
        or: [
          { and: [{ from: { eq: from } }, { to: { eq: to } }] },
          { and: [{ from: { eq: to } }, { to: { eq: from } }] }
        ]
      } } });
      const existingEdges = (existingResponse as any).data.listEdges.items || [];
      
      if (existingEdges.length > 0) {
        console.log('Edge already exists:', existingEdges[0]);
        return existingEdges[0]; // Return existing edge
      }
      
      const response = await client.graphql({ query: createEdge, variables: { input: {
        projectId,
        edgeId: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        from,
        to
      } } });
      console.log('Create edge response:', response);
      return (response as any).data.createEdge;
    } catch (error) {
      console.error('Error creating edge:', error);
      throw error;
    }
  },
  async deleteEdge(projectId: string, edgeId: string) {
    try {
      console.log('Deleting edge:', { projectId, edgeId });
      
      // First find the edge to get the database ID
      const listResponse = await client.graphql({ query: listEdges, variables: { filter: { projectId: { eq: projectId }, edgeId: { eq: edgeId } } } });
      const items = (listResponse as any).data.listEdges.items || [];
      
      if (items.length === 0) {
        console.warn(`Edge not found: ${edgeId}`);
        return; // Edge doesn't exist, consider it deleted
      }
      
      const edgeToDelete = items[0];
      const response = await client.graphql({ query: deleteEdge, variables: { input: { id: edgeToDelete.id } } });
      console.log('Delete edge response:', response);
      return response;
    } catch (error) {
      console.error('Error deleting edge:', error);
      throw error;
    }
  },

  // Subscriptions temporarily disabled
  subscribe(projectId: string, onEvent: (evt: { type:'created'|'updated'|'deleted'|'edge'; payload: any }) => void) {
    console.log('Subscriptions temporarily disabled');
    return () => {};
  },
};