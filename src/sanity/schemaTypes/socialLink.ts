import { defineType, defineField } from 'sanity'
import { LinkIcon } from '@sanity/icons'

export const socialLink = defineType({
  name: 'socialLink',
  title: 'Social Link',
  type: 'document',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'platform',
      type: 'string',
      title: 'Platform',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      type: 'url',
      title: 'URL',
      validation: (rule) =>
        rule.required().uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'order',
      type: 'number',
      title: 'Sort Order',
      description: 'Lower numbers appear first',
    }),
  ],
  orderings: [
    {
      title: 'Sort Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'platform',
      subtitle: 'url',
    },
  },
})
