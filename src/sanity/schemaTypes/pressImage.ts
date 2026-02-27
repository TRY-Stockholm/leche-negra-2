import { defineType, defineField } from 'sanity'
import { ImageIcon } from '@sanity/icons'

export const pressImage = defineType({
  name: 'pressImage',
  title: 'Press Image',
  type: 'document',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          validation: (rule) => rule.required().warning('Alt text is important for accessibility'),
        }),
      ],
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
      media: 'image',
    },
  },
})
