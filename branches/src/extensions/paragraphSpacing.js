import { Extension } from '@tiptap/core'

/**
 * Paragraph spacing (gap after Enter / new <p>).
 * Does not affect Shift+Enter hard breaks (<br>) within a paragraph.
 */
export const ParagraphSpacing = Extension.create({
  name: 'paragraphSpacing',

  addOptions() {
    return {
      types: ['paragraph'],
      spacings: ['normal', 'relaxed'],
      defaultSpacing: 'normal',
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          paragraphSpacing: {
            default: this.options.defaultSpacing,
            parseHTML: (element) => {
              const value = element.getAttribute('data-paragraph-spacing')
              if (value === 'relaxed') return 'relaxed'
              // legacy "compact" and missing attribute both use default tight spacing
              return this.options.defaultSpacing
            },
            renderHTML: (attributes) => {
              if (attributes.paragraphSpacing !== 'relaxed') {
                return {}
              }
              return { 'data-paragraph-spacing': 'relaxed' }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setParagraphSpacing:
        (spacing) =>
        ({ commands }) => {
          if (!this.options.spacings.includes(spacing)) {
            return false
          }
          return this.options.types
            .map((type) => commands.updateAttributes(type, { paragraphSpacing: spacing }))
            .some((response) => response)
        },
    }
  },
})
