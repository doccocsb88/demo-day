import axios from 'axios';
import { RemoteConfigChangeRequest, Reviewer } from '../types';

export class SlackService {
  async sendNotification(
    webhookUrl: string,
    changeRequest: RemoteConfigChangeRequest,
    event: 'reviewer_added' | 'submitted_for_review',
    reviewerId?: string
  ): Promise<void> {
    try {
      let message: any = {
        text: '',
        blocks: [],
      };

      if (event === 'submitted_for_review') {
        message.text = `New Change Request Submitted for Review`;
        message.blocks = [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🔔 New Change Request',
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Title:*\n${changeRequest.title}`,
              },
              {
                type: 'mrkdwn',
                text: `*Environment:*\n${changeRequest.env.toUpperCase()}`,
              },
              {
                type: 'mrkdwn',
                text: `*Created By:*\n${changeRequest.createdBy}`,
              },
              {
                type: 'mrkdwn',
                text: `*Status:*\n${changeRequest.status}`,
              },
            ],
          },
        ];

        if (changeRequest.description) {
          message.blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Description:*\n${changeRequest.description}`,
            },
          });
        }

        // Add summary of changes
        const { diff } = changeRequest;
        const changes = [
          `➕ ${diff.addedParams.length} parameters added`,
          `✏️ ${diff.updatedParams.length} parameters updated`,
          `➖ ${diff.removedParams.length} parameters removed`,
        ].filter((line) => !line.includes('0 '));

        if (changes.length > 0) {
          message.blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Changes:*\n${changes.join('\n')}`,
            },
          });
        }
      } else if (event === 'reviewer_added' && reviewerId) {
        message.text = `Reviewer Added to Change Request`;
        message.blocks = [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '👤 Reviewer Added',
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Change Request:*\n${changeRequest.title}`,
              },
              {
                type: 'mrkdwn',
                text: `*Environment:*\n${changeRequest.env.toUpperCase()}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*New Reviewer:*\n<@${reviewerId}>`,
            },
          },
        ];
      }

      // Add action button
      message.blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Change Request',
              emoji: true,
            },
            style: 'primary',
            url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/preview/${changeRequest.id}`,
          },
        ],
      });

      await axios.post(webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error: any) {
      console.error('Error sending Slack notification:', error.message);
      // Don't throw error - Slack notification failure shouldn't break the main flow
    }
  }

  async sendReviewerNotification(
    webhookUrl: string,
    changeRequest: RemoteConfigChangeRequest,
    reviewer: Reviewer
  ): Promise<void> {
    try {
      const message = {
        text: `Reviewer Added to Change Request`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '👤 Reviewer Assignment',
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Change Request:*\n${changeRequest.title}`,
              },
              {
                type: 'mrkdwn',
                text: `*Environment:*\n${changeRequest.env.toUpperCase()}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `You have been assigned as a reviewer for this change request.\n\n*Reviewer ID:* ${reviewer.userId}`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Review Now',
                  emoji: true,
                },
                style: 'primary',
                url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/preview/${changeRequest.id}`,
              },
            ],
          },
        ],
      };

      await axios.post(webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error: any) {
      console.error('Error sending Slack notification to reviewer:', error.message);
      // Don't throw error - Slack notification failure shouldn't break the main flow
    }
  }
}

