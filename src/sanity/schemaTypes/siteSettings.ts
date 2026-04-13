import { defineType, defineField } from 'sanity'
import { CogIcon } from '@sanity/icons'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'address',
      type: 'string',
      title: 'Address',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'addressMapUrl',
      type: 'url',
      title: 'Address Map URL',
      validation: (rule) =>
        rule.uri({
          scheme: ['https'],
        }),
    }),
    defineField({
      name: 'email',
      type: 'string',
      title: 'Email',
      validation: (rule) =>
        rule.required().email(),
    }),
    defineField({
      name: 'openingHours',
      type: 'string',
      title: 'Opening Hours',
    }),
    defineField({
      name: 'showMenus',
      type: 'boolean',
      title: 'Show Menus',
      description: 'Toggle menus and booking on/off. When off, a countdown is shown instead.',
      initialValue: false,
    }),
    defineField({
      name: 'bookingUrl',
      type: 'url',
      title: 'Booking URL',
      validation: (rule) =>
        rule.uri({
          scheme: ['http', 'https'],
        }),
    }),
    defineField({
      name: 'speakeasyMood',
      type: 'string',
      title: 'Speakeasy Mood',
      description: 'A short atmospheric status shown on the speakeasy page. e.g. "the room is quiet tonight", "standing room only", "come early".',
      options: {
        list: [
          { title: 'The room is quiet tonight', value: 'the room is quiet tonight' },
          { title: 'A few seats left', value: 'a few seats left' },
          { title: 'Standing room only', value: 'standing room only' },
          { title: 'The room is full', value: 'the room is full' },
          { title: 'Closed tonight', value: 'closed tonight' },
        ],
      },
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Site Settings',
      }
    },
  },
})
