import { defineQuery } from 'next-sanity'

export const SITE_SETTINGS_QUERY = defineQuery(
  `*[_type == "siteSettings"][0] {
    address,
    addressMapUrl,
    email,
    openingHours,
    bookingUrl
  }`
)

export const SOCIAL_LINKS_QUERY = defineQuery(
  `*[_type == "socialLink"] | order(order asc, _createdAt asc) {
    _id,
    platform,
    url
  }`
)

export const MENUS_QUERY = defineQuery(
  `*[_type == "menu"] | order(order asc, _createdAt asc) {
    _id,
    title,
    hours,
    intro,
    "pdfUrl": pdf.asset->url
  }`
)
