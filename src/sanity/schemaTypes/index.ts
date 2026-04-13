import { type SchemaTypeDefinition } from 'sanity'
import { pressImage } from './pressImage'
import { siteSettings } from './siteSettings'
import { socialLink } from './socialLink'
import { menu } from './menu'
import { pressQuote } from './pressQuote'
import { membershipRequest } from './membershipRequest'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [pressImage, siteSettings, socialLink, menu, pressQuote, membershipRequest],
}
