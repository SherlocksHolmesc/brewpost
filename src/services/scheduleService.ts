import '../amplify-config';
import { generateClient } from '@aws-amplify/api';
import { listNodes } from '../graphql/queries';
import { createSchedule } from '../graphql/mutations';
import type { NodeDTO } from './nodeService';
import { NodeAPI } from './nodeService';

const client = generateClient();

export const scheduleService = {
  async createSchedules(nodes: Partial<NodeDTO>[]) {
    console.log('scheduleService.createSchedules called with:', nodes);
    const results = [];
    
    for (const node of nodes) {
      try {
        console.log('Processing node for scheduling:', node.id, node.title);
        
        // Update node status to scheduled using NodeAPI
        const updateData = {
          projectId: 'demo-project-123',
          nodeId: node.id!,
          status: 'scheduled',
          scheduledDate: node.scheduledDate,
          imageUrl: node.imageUrl,
          imageUrls: node.imageUrls
        };
        
        console.log('Calling NodeAPI.update with:', updateData);
        const updateResult = await NodeAPI.update(updateData);
        console.log('NodeAPI.update result:', updateResult);

        // Also create a schedule record in the Schedule table
        const scheduleInput = {
          scheduleId: node.id!,
          title: node.title || 'Untitled',
          content: node.description || '',
          imageUrl: node.imageUrl || null,
          scheduledDate: node.scheduledDate!,
          status: 'scheduled',
          userId: 'demo-user'
        };
        
        console.log('Creating schedule record with:', scheduleInput);
        const scheduleResult = await client.graphql({
          query: createSchedule,
          variables: { input: scheduleInput }
        });
        console.log('Schedule creation result:', scheduleResult);

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

      const items = (result.data.listNodes as any).items || result.data.listNodes || [];
      const schedules = items
        .filter((item: any) => item.status === 'scheduled' || item.status === 'published')
        .map((item: any) => ({
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