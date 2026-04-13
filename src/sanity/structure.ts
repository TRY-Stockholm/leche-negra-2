import type { StructureResolver } from 'sanity/structure'

const HIDDEN_TYPES = ['siteSettings', 'membershipRequest']

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Settings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings'),
        ),

      S.divider(),

      // ── Noctuaires membership requests ──
      S.listItem()
        .title('Membership Requests')
        .icon(() => '🚪')
        .child(
          S.list()
            .title('Membership Requests')
            .items([
              S.listItem()
                .title('Pending')
                .icon(() => '⏳')
                .child(
                  S.documentList()
                    .title('Pending Requests')
                    .schemaType('membershipRequest')
                    .filter('_type == "membershipRequest" && status == "pending"')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('Approved')
                .icon(() => '✅')
                .child(
                  S.documentList()
                    .title('Approved Members')
                    .schemaType('membershipRequest')
                    .filter('_type == "membershipRequest" && status == "approved"')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('Declined')
                .icon(() => '❌')
                .child(
                  S.documentList()
                    .title('Declined')
                    .schemaType('membershipRequest')
                    .filter('_type == "membershipRequest" && status == "declined"')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.divider(),
              S.listItem()
                .title('All Requests')
                .child(
                  S.documentList()
                    .title('All Requests')
                    .schemaType('membershipRequest')
                    .filter('_type == "membershipRequest"')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
            ]),
        ),

      S.divider(),

      // ── Everything else ──
      ...S.documentTypeListItems().filter(
        (listItem) => !HIDDEN_TYPES.includes(listItem.getId() as string),
      ),
    ])
