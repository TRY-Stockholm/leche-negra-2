import { type SchemaTypeDefinition } from 'sanity'
import { pressImage } from './pressImage'
import { siteSettings } from './siteSettings'
import { socialLink } from './socialLink'
import { menu } from './menu'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [pressImage, siteSettings, socialLink, menu],
}
