import '../amplify-config';
import { generateClient } from '@aws-amplify/api';
import { listNodes } from '../graphql/queries';
import type { NodeDTO } from './nodeService';
import { NodeAPI } from './nodeService';

const client = generateClient();

// Inline mutation for Lambda-backed batch scheduling
const CREATE_SCHEDULE_WITH_EVENTBRIDGE = /* GraphQL */ `
  mutation CreateScheduleWithEventBridge($input: ScheduleEventBridgeInput!) {
    createScheduleWithEventBridge(input: $input) {
      ok
      scheduled {
        scheduleId
        status
        scheduledDate
      }
      __typename
    }
  }
`;

export const scheduleService = {
  async createSchedules(nodes: Partial<NodeDTO>[]) {
    console.log('scheduleService.createSchedules called with:', nodes);

    // Build batch payload for Lambda-backed mutation
    const userId = (typeof window !== 'undefined' ? window.localStorage.getItem('userId') : null) || 'demo-user';
    const nodesPayload = nodes.map((node) => ({
      id: node.id!,
      projectId: 'demo-project-123',
      nodeId: node.id!,
      title: node.title || 'Untitled',
      description: (node as any).description || (node as any).content || '',
      type: (node as any).type || 'post',
      imageUrl: node.imageUrl || null,
      imageUrls: node.imageUrls || (node.imageUrl ? [node.imageUrl] : null),
      scheduledDate: node.scheduledDate!,
      status: 'scheduled',
    }));

    console.log('Calling Lambda via createScheduleWithEventBridge with nodes:', nodesPayload.length);
    try {
      const scheduleResult = await client.graphql({
        query: CREATE_SCHEDULE_WITH_EVENTBRIDGE,
        variables: { input: { nodes: nodesPayload, userId } as any },
      });
      console.log('Lambda batch schedule result:', scheduleResult);

      const payload = (scheduleResult as any)?.data?.createScheduleWithEventBridge;
      const scheduled = Array.isArray(payload?.scheduled) ? payload.scheduled : [];
      // Normalize return shape to existing callers
      const results = nodes.map((n) => {
        const matched = scheduled.find((s: any) => s.scheduleId === n.id);
        return {
          id: n.id,
          scheduleId: n.id,
          ok: !!matched,
          status: matched?.status || 'scheduled',
          scheduledDate: matched?.scheduledDate || (n as any).scheduledDate,
        };
      });
      return { ok: true, results, scheduled: results };
    } catch (error) {
      console.error('Failed to create schedules via EventBridge:', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' } as any;
    }
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