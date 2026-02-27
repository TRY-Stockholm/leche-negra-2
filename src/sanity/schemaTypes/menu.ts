import { defineType, defineField } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons'

export const menu = defineType({
  name: 'menu',
  title: 'Menu',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'hours',
      type: 'string',
      title: 'Hours',
    }),
    defineField({
      name: 'intro',
      type: 'text',
      title: 'Intro',
      rows: 3,
    }),
    defineField({
      name: 'pdf',
      type: 'file',
      title: 'PDF',
      options: { accept: 'application/pdf' },
      validation: (rule) => rule.required(),
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
      title: 'title',
      subtitle: 'hours',
    },
  },
})
