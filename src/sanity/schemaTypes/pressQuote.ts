import { defineType, defineField } from 'sanity'
import { BlockquoteIcon } from '@sanity/icons'

export const pressQuote = defineType({
  name: 'pressQuote',
  title: 'Press Quote',
  type: 'document',
  icon: BlockquoteIcon,
  fields: [
    defineField({
      name: 'text',
      type: 'text',
      title: 'Quote Text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      type: 'number',
      title: 'Sort Order',
      description: 'Lower numbers appear first',
    }),
  ],
  preview: {
    select: { title: 'text' },
    prepare({ title }) {
      return {
        title: title?.length > 60 ? title.slice(0, 60) + '…' : title,
      }
    },
  },
})
