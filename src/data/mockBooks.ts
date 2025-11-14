import type { Book } from '@/types/library'

export const mockBooks: Book[] = [
  {
    id: 'bk-lunar-voices',
    title: 'Lunar Voices: Stories from the Moonrise Studio',
    author: 'Aria Chen',
    isbn: '978-1-4028-9462-1',
    category: 'FIC.CHE',
    location: 'Shelf A2',
    status: 'available',
    summary:
      'A collection of speculative short stories co-written by Moonshot students exploring identity, technology, and community on a future moon campus.',
    cover:
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=600&q=80',
    tags: ['fiction', 'anthology', 'student work'],
  },
  {
    id: 'bk-systems-thinking',
    title: 'Systems Thinking for Changemakers',
    author: 'Donella Meadows',
    isbn: '978-1-4532-1184-4',
    category: 'SCI.MEA',
    location: 'Shelf C1',
    status: 'borrowed',
    summary:
      'Practical guide to identifying leverage points in complex systems with case studies from education, health, and sustainability initiatives.',
    cover:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
    tags: ['non-fiction', 'systems', 'climate'],
  },
  {
    id: 'bk-designing-learning',
    title: 'Designing Regenerative Learning',
    author: 'Nova Patel',
    isbn: '978-1-64421-302-9',
    category: 'EDU.PAT',
    location: 'Shelf B4',
    status: 'available',
    summary:
      'Frameworks and routines for student-led studios, featuring Moonshot case studies on interdisciplinary collaboration.',
    cover:
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=600&q=80',
    tags: ['education', 'design', 'project-based'],
  },
  {
    id: 'bk-poetic-code',
    title: 'Poetic Code: Creative Coding with Purpose',
    author: 'Milo Ortega',
    isbn: '978-0-262-03781-9',
    category: 'TECH.ORT',
    location: 'Shelf D2',
    status: 'reserved',
    summary:
      'Blends computation and storytelling with practical workshops for Processing, p5.js, and creative AI experiments.',
    cover:
      'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=600&q=80',
    tags: ['technology', 'art', 'creative coding'],
  },
  {
    id: 'bk-urban-gardens',
    title: 'Urban Gardens of Tomorrow',
    author: 'Selene Huang',
    isbn: '978-1-9821-7436-7',
    category: 'ENV.HUA',
    location: 'Shelf F1',
    status: 'available',
    summary:
      'Design playbook for rooftop farms and micro-forests, integrating biomimicry and circular-economy thinking.',
    cover:
      'https://images.unsplash.com/photo-1455885666463-1ea8f31a3c6f?auto=format&fit=crop&w=600&q=80',
    tags: ['environment', 'design', 'sustainability'],
  },
  {
    id: 'bk-ai-literacy',
    title: 'AI Literacy for Students',
    author: 'Jules Park',
    isbn: '978-1-77539-028-8',
    category: 'TECH.PAR',
    location: 'Shelf D5',
    status: 'available',
    summary:
      'Step-by-step guide for building responsible AI projects with emphasis on ethics, dataset design, and reflective practice.',
    cover:
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=600&q=80',
    tags: ['technology', 'ethics', 'ai'],
  },
]
