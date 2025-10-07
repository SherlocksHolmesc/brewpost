import '../amplify-config';
import { generateClient } from '@aws-amplify/api';
import { listNodes } from '../graphql/queries';
import type { NodeDTO } from './nodeService';
import { NodeAPI } from './nodeService';

const client = generateClient();

export const scheduleService = {
  async createSchedules(nodes: Partial<NodeDTO>[]) {
    const results = [];
    
    for (const node of nodes) {
      try {
        // Update node status to scheduled using NodeAPI
        await NodeAPI.update({
          projectId: 'demo-project-123',
          nodeId: node.id!,
          status: 'scheduled',
          scheduledDate: node.scheduledDate
        });

        results.push({
          id: node.id,
          scheduleId: node.id,
          ok: true,
          status: 'scheduled',
          scheduledDate: node.scheduledDate
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

    return { ok: true, results, scheduled: results };
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