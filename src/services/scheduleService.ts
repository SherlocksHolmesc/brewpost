import '../amplify-config';
import { generateClient } from '@aws-amplify/api';
import { createNode, updateNode, deleteNode } from '../graphql/mutations';
import { listNodes } from '../graphql/queries';
import type { NodeDTO } from './nodeService';

const client = generateClient();

export const scheduleService = {
  async createSchedules(nodes: Partial<NodeDTO>[]) {
    // Return success immediately - actual scheduling handled by PlanningPanel
    const results = nodes.map(node => ({
      id: node.id,
      ok: true,
      action: 'scheduled',
      scheduledDate: node.scheduledDate
    }));

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