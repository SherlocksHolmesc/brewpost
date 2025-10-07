import '../amplify-config';
import { generateClient } from '@aws-amplify/api';
import { createNode, updateNode, deleteNode } from '../graphql/mutations';
import { listNodes } from '../graphql/queries';
import type { NodeDTO } from './nodeService';

const client = generateClient();

export const scheduleService = {
  async createSchedules(nodes: Partial<NodeDTO>[]) {
    const results = [];
    
    for (const node of nodes) {
      try {
        const input = {
          projectId: 'default-project',
          nodeId: node.id,
          title: node.title || 'Untitled',
          description: (node as any).content || node.description || '',
          status: 'scheduled', // This will update the status
          type: node.type || 'post',
          scheduledDate: node.scheduledDate,
          imageUrl: node.imageUrl,
          imagePrompt: node.imagePrompt,
          x: node.x || 0,
          y: node.y || 0
        };

        // Update existing node instead of creating new one
        const result = await client.graphql({
          query: updateNode,
          variables: { 
            input: {
              id: node.id, // Use the existing node ID
              status: 'scheduled',
              scheduledDate: node.scheduledDate
            }
          }
        });

        results.push({
          id: node.id,
          ok: true,
          action: 'created',
          data: result.data.createNode
        });
      } catch (error) {
        console.error('Failed to create schedule:', error);
        results.push({
          id: node.id,
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // 2. Trigger Lambda via AppSync for EventBridge scheduling
    try {
      await client.graphql({
        query: `mutation CreateScheduleWithEventBridge($input: ScheduleEventBridgeInput!) {
          createScheduleWithEventBridge(input: $input) {
            ok
            scheduled {
              scheduleId
              status
              scheduledDate
            }
          }
        }`,
        variables: { input: { nodes } }
      });
    } catch (error) {
      console.warn('EventBridge scheduling failed:', error);
    }

    return { ok: true, results };
  },

  async listSchedules() {
    try {
      const result = await client.graphql({
        query: listNodes
      });

      const schedules = result.data.listNodes.items
        .filter(item => item.status === 'scheduled' || item.status === 'published')
        .map(item => ({
          scheduleId: item.nodeId || item.id,
          userId: item.projectId,
          status: item.status,
          createdAt: item.createdAt,
          scheduledDate: item.scheduledDate,
          title: item.title,
          content: item.description,
          imageUrl: item.imageUrl,
          type: item.type
        }));

      return { ok: true, schedules };
    } catch (error) {
      console.error('Failed to list schedules:', error);
      return { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
};