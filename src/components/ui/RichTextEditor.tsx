import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Link as LinkIcon,
  SmilePlus,
} from 'lucide-react'

// Define the Props for our generic Rich Text Editor
interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({ content, onChange, placeholder, minHeight = '150px' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-600 hover:underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Descreva aqui...',
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-gray-300 before:absolute before:pointer-events-none',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      // get the HTML output and pass it to the parent
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none min-h-[${minHeight}] px-4 py-3 relative`,
      },
    }
  })

  // Optional: Update editor content when external content changes 
  // (requires caution to avoid cursor jumps, usually handled by checking if external content is different from editor content)
  
  if (!editor) {
    return null
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="w-full border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-transparent transition bg-white flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-white">
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors font-bold text-sm ${
            editor.isActive('bold') ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Negrito"
        >
          B
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors italic text-sm ${
            editor.isActive('italic') ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-500'
          }`}
          title="Itálico"
        >
          I
        </button>
        <button
          onClick={(e) => { e.preventDefault(); setLink() }}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            editor.isActive('link') ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-500'
          }`}
          title="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        {/* Placeholder Emoji Button (TipTap doesn't have native emoji extension without extra plugins, keeping visual layout) */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          title="Emoji (Em breve)"
          onClick={(e) => e.preventDefault()}
        >
          <SmilePlus className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto cursor-text" onClick={() => editor.chain().focus().run()}>
         <EditorContent editor={editor} />
      </div>
      
      {/* Global styles for placeholder (if not using tip-tap placeholder extension) could go here or in global css */}
    </div>
  )
}
