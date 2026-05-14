import { defineType, defineField } from 'sanity'
import { MoonIcon } from '@sanity/icons'

export const speakeasyPage = defineType({
  name: 'speakeasyPage',
  title: 'Speakeasy Page',
  type: 'document',
  icon: MoonIcon,
  fields: [
    defineField({
      name: 'eyebrow',
      type: 'string',
      title: 'Eyebrow',
      description: 'Small uppercase label above the tagline. Keep it short and atmospheric — avoid wayfinding language (no "door", "stairs", etc.).',
    }),
    defineField({
      name: 'tagline',
      type: 'text',
      title: 'Tagline',
      rows: 2,
      description: 'The large italic tagline. Use a line break to split across two lines.',
    }),
    defineField({
      name: 'aboutBody',
      type: 'text',
      title: 'About the Room — Body',
      rows: 5,
      description: 'The paragraph that reveals when a visitor opens "about the room". Keep it cryptic — avoid giving instructions or naming the entrance.',
    }),
    defineField({
      name: 'pdf',
      type: 'file',
      title: 'Cocktail Menu (PDF)',
      description: 'When set, the "see cocktails" link appears. Leave empty to hide the link entirely.',
      options: { accept: 'application/pdf' },
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Speakeasy Page',
      }
    },
  },
})
