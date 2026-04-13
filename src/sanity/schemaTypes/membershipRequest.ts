import { defineType, defineField } from 'sanity'
import { UsersIcon } from '@sanity/icons'

export const membershipRequest = defineType({
  name: 'membershipRequest',
  title: 'Membership Request',
  type: 'document',
  icon: UsersIcon,
  fields: [
    // ── Status — the only thing editors should change ──
    defineField({
      name: 'status',
      type: 'string',
      title: 'Status',
      initialValue: 'pending',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Approved', value: 'approved' },
          { title: 'Declined', value: 'declined' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'notes',
      type: 'text',
      title: 'Internal Notes',
      description: 'Only visible in the studio. Not shown to the applicant.',
      rows: 3,
    }),

    // ── Submission data — read-only, set by the API ──
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      type: 'string',
      title: 'Email',
      readOnly: true,
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'phone',
      type: 'string',
      title: 'Phone',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'instagram',
      type: 'string',
      title: 'Instagram',
      readOnly: true,
    }),
    defineField({
      name: 'submittedAt',
      type: 'datetime',
      title: 'Submitted At',
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: 'Newest First',
      name: 'submittedAtDesc',
      by: [{ field: 'submittedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'email', status: 'status', date: 'submittedAt' },
    prepare({ title, subtitle, status, date }) {
      const icons: Record<string, string> = { pending: '\u23F3', approved: '\u2705', declined: '\u274C' }
      const d = date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''
      return {
        title: `${icons[status] || ''} ${title}`,
        subtitle: `${subtitle}${d ? ` \u00B7 ${d}` : ''}`,
      }
    },
  },
})
