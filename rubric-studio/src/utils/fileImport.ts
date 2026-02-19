import { ChatMessage } from '@/types'

export async function parseChatLog(file: File): Promise<ChatMessage[]> {
    const text = await file.text()
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension === 'json') {
        try {
            const json = JSON.parse(text)
            // Handle array directly or object wrapper
            const array = Array.isArray(json) ? json : json.messages || json.chatLog

            if (!Array.isArray(array)) throw new Error('Invalid JSON format')

            return array.map((msg: any, i: number) => ({
                id: msg.id || `imported_${Date.now()}_${i}`,
                role: msg.role || (msg.sender === 'student' ? 'user' : 'assistant'),
                content: msg.content || msg.message || msg.text,
                timestamp: msg.timestamp || new Date().toISOString()
            }))
        } catch (e) {
            console.error('JSON Parse Error', e)
            throw new Error('Failed to parse JSON')
        }
    }

    if (extension === 'csv') {
        // Simple CSV parser (assumes Role, Content columns)
        const lines = text.split('\n')
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim())

        const roleIdx = headers.findIndex(h => h.includes('role') || h.includes('sender'))
        const contentIdx = headers.findIndex(h => h.includes('content') || h.includes('message'))

        if (roleIdx === -1 || contentIdx === -1) {
            throw new Error('CSV must have "Role" and "Content" columns')
        }

        return lines.slice(1).filter(l => l.trim()).map((line, i) => {
            // Handle quoted content (basic regex)
            const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',')

            // Fallback for simple split if regex fails or matches strangely
            const safeSplit = line.split(',')

            let role = safeSplit[roleIdx]?.trim().replace(/^"|"$/g, '').toLowerCase()
            let content = safeSplit.slice(contentIdx).join(',').trim() // Content might contain commas

            // Normalize role
            if (role === 'student' || role === 'me') role = 'user'
            if (role === 'teacher' || role === 'ai' || role === 'tutor') role = 'assistant'

            return {
                id: `imported_csv_${Date.now()}_${i}`,
                role: (role as 'user' | 'assistant') || 'user',
                content: content.replace(/^"|"$/g, '').replace(/""/g, '"'),
                timestamp: new Date().toISOString()
            }
        })
    }

    throw new Error('Unsupported file format. Please upload JSON or CSV.')
}

export function parseRawText(text: string): ChatMessage[] {
    const lines = text.split('\n')
    const messages: ChatMessage[] = []

    let currentRole: 'user' | 'assistant' | null = null
    let currentContent: string[] = []

    // Helper to flush current message
    const flush = () => {
        if (currentRole && currentContent.length > 0) {
            messages.push({
                id: `pasted_${Date.now()}_${messages.length}`,
                role: currentRole,
                content: currentContent.join('\n').trim(),
                timestamp: new Date().toISOString()
            })
            currentContent = []
        }
    }

    const roleRegex = /^(Student|User|Me|Teacher|AI|Assistant|Coach|Tutor):\s*/i

    for (const line of lines) {
        const match = line.match(roleRegex)

        if (match) {
            // New message start
            flush() // Save previous message

            const roleStr = match[1].toLowerCase()
            if (['student', 'user', 'me'].includes(roleStr)) {
                currentRole = 'user'
            } else {
                currentRole = 'assistant'
            }

            // Remove the prefix from the content
            currentContent.push(line.replace(roleRegex, '').trim())
        } else {
            // Continuation of previous message
            // If no role set yet, default to user for the first block
            if (!currentRole && line.trim()) {
                currentRole = 'user'
            }
            if (line.trim()) {
                currentContent.push(line.trim())
            }
        }
    }

    flush() // Final flush

    if (messages.length === 0) {
        throw new Error('No valid messages found. Please format as "Student: Hello" or "AI: Hi".')
    }

    return messages
}
