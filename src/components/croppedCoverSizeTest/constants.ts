export const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600'

export const CROPPED_COVER_DIMENSIONS = {
  width: 140,
  height: 200,
  ratio: '7:10',
  decimal: 0.7
} as const

export const TEST_CONFIGURATIONS = [
  {
    id: 'default',
    title: 'Default Cropped',
    color: 'green',
    borderColor: 'border-green-300',
    description: 'Default behavior',
    props: { cropToRight: true },
    code: 'cropToRight: true'
  },
  {
    id: 'fixed-true',
    title: 'Fixed Size True',
    color: 'green',
    borderColor: 'border-green-300',
    description: 'Explicitly fixed',
    props: { cropToRight: true, fixedSize: true },
    code: 'fixedSize: true'
  },
  {
    id: 'container',
    title: 'Container Size',
    color: 'blue',
    borderColor: 'border-blue-300',
    description: 'Container sizing',
    props: { className: 'w-[140px] h-[200px]', cropToRight: true, fixedSize: false },
    code: 'className: w-[140px] h-[200px]'
  },
  {
    id: 'movie-thumbnail',
    title: 'MovieThumbnail',
    color: 'purple',
    borderColor: 'border-purple-300',
    description: 'aspect-[7/10]',
    props: { className: 'w-full h-full', cropToRight: true, fixedSize: false },
    code: 'MovieThumbnail style',
    containerClass: 'aspect-[7/10] w-[140px] bg-gray-100 rounded overflow-hidden'
  }
] as const

export const SIZE_SPECIFICATIONS = {
  dimensions: {
    title: 'Dimensions',
    color: 'blue',
    items: [
      'Width: 140px',
      'Height: 200px',
      'Ratio: 7:10 (0.7)'
    ]
  },
  css: {
    title: 'CSS Classes',
    color: 'green',
    items: [
      'w-[140px] h-[200px]',
      'aspect-[7/10]',
      'object-cover'
    ]
  },
  position: {
    title: 'Object Position',
    color: 'purple',
    items: [
      'objectPosition:',
      "'100% center'",
      '// RIGHT SIDE'
    ]
  }
} as const

export const TEST_RESULTS = [
  'Default cropped size: 140x200px',
  'Fixed size option: 140x200px',
  'Container responsive: 140x200px',
  'MovieThumbnail integration: 