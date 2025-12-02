export interface MoonshotBookSeed {
  id: string;
  title: string;
  authors: string[];
  isbn: string;
  category: string;
  location: string;
  status: 'available' | 'borrowed' | 'reserved';
  description: string;
  coverImage: string;
  tags: string[];
  totalCopies: number;
  availableCopies: number;
  publisher?: string;
}

const createSeed = (seed: Omit<MoonshotBookSeed, 'availableCopies'> & { availableCopies?: number }): MoonshotBookSeed => {
  const availableCopies =
    seed.availableCopies !== undefined
      ? seed.availableCopies
      : seed.status === 'available'
        ? seed.totalCopies
        : Math.max(seed.totalCopies - 1, 0);

  return {
    ...seed,
    availableCopies,
  };
};

export const moonshotBooks: MoonshotBookSeed[] = [
  createSeed({
    id: 'bk-lunar-voices',
    title: 'Lunar Voices: Stories from the Moonrise Studio',
    authors: ['Aria Chen'],
    isbn: '978-1-4028-9462-1',
    category: 'FIC.CHE',
    location: 'Shelf A2',
    status: 'available',
    description:
      'A collection of speculative short stories co-written by Moonshot students exploring identity, technology, and community on a future moon campus.',
    coverImage: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=600&q=80',
    tags: ['fiction', 'anthology', 'student work'],
    totalCopies: 4,
    publisher: 'Moonrise Studio Press',
  }),
  createSeed({
    id: 'bk-systems-thinking',
    title: 'Systems Thinking for Changemakers',
    authors: ['Donella Meadows'],
    isbn: '978-1-4532-1184-4',
    category: 'SCI.MEA',
    location: 'Shelf C1',
    status: 'borrowed',
    description:
      'Practical guide to identifying leverage points in complex systems with case studies from education, health, and sustainability initiatives.',
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
    tags: ['non-fiction', 'systems', 'climate'],
    totalCopies: 5,
    publisher: 'Learning Futures',
  }),
  createSeed({
    id: 'bk-designing-learning',
    title: 'Designing Regenerative Learning',
    authors: ['Nova Patel'],
    isbn: '978-1-64421-302-9',
    category: 'EDU.PAT',
    location: 'Shelf B4',
    status: 'available',
    description:
      'Frameworks and routines for student-led studios, featuring Moonshot case studies on interdisciplinary collaboration.',
    coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=600&q=80',
    tags: ['education', 'design', 'project-based'],
    totalCopies: 3,
    publisher: 'Studio Lab Editions',
  }),
  createSeed({
    id: 'bk-poetic-code',
    title: 'Poetic Code: Creative Coding with Purpose',
    authors: ['Milo Ortega'],
    isbn: '978-0-262-03781-9',
    category: 'TECH.ORT',
    location: 'Shelf D2',
    status: 'reserved',
    description:
      'Blends computation and storytelling with practical workshops for Processing, p5.js, and creative AI experiments.',
    coverImage: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=600&q=80',
    tags: ['technology', 'art', 'creative coding'],
    totalCopies: 4,
    publisher: 'Creative Futures Lab',
  }),
  createSeed({
    id: 'bk-urban-gardens',
    title: 'Urban Gardens of Tomorrow',
    authors: ['Selene Huang'],
    isbn: '978-1-9821-7436-7',
    category: 'ENV.HUA',
    location: 'Shelf F1',
    status: 'available',
    description:
      'Design playbook for rooftop farms and micro-forests, integrating biomimicry and circular-economy thinking.',
    coverImage: 'https://images.unsplash.com/photo-1455885666463-1ea8f31a3c6f?auto=format&fit=crop&w=600&q=80',
    tags: ['environment', 'design', 'sustainability'],
    totalCopies: 6,
    publisher: 'Green Horizon',
  }),
  createSeed({
    id: 'bk-ai-literacy',
    title: 'AI Literacy for Students',
    authors: ['Jules Park'],
    isbn: '978-1-77539-028-8',
    category: 'TECH.PAR',
    location: 'Shelf D5',
    status: 'available',
    description:
      'Step-by-step guide for building responsible AI projects with emphasis on ethics, dataset design, and reflective practice.',
    coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=600&q=80',
    tags: ['technology', 'ethics', 'ai'],
    totalCopies: 5,
    publisher: 'Civic Tech Press',
  }),
];
