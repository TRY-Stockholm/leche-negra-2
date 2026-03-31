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
  ],
  preview: {
    prepare() {
      return {
        title: 'Site Settings',
      }
    },
  },
})
