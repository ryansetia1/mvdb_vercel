export interface AIModel {
    id: string
    name: string
    provider: 'google' | 'openai' | 'anthropic'
    contextLength: number
    inputPrice: number // per 1M tokens
    outputPrice: number // per 1M tokens
    label?: 'cheapest' | 'fastest' | 'balanced' | 'best_quality'
    description?: string
}

export const AVAILABLE_MODELS: AIModel[] = [
    {
        id: 'gemini/gemini-2.0-flash-lite',
        name: 'Gemini 2.0 Flash Lite',
        provider: 'google',
        contextLength: 1048576,
        inputPrice: 0.07,
        outputPrice: 0.30,
        label: 'cheapest',
        description: 'Model paling murah dan cepat, ideal untuk bulk operations.'
    },
    {
        id: 'gemini/gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        contextLength: 1048576,
        inputPrice: 0.10,
        outputPrice: 0.40,
        label: 'balanced',
        description: 'Seimbang antara performa dan biaya. Standar yang bagus.'
    },
    {
        id: 'gemini/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'google',
        contextLength: 1048576,
        inputPrice: 0.30,
        outputPrice: 2.50,
        description: 'Versi lebih baru dengan penalaran lebih baik.'
    },
    {
        id: 'gemini/gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'google',
        contextLength: 2097152,
        inputPrice: 1.25,
        outputPrice: 3.75,
        label: 'best_quality',
        description: 'Model premium dari Google dengan kemampuan penalaran tinggi.'
    },
    {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        contextLength: 128000,
        inputPrice: 0.15,
        outputPrice: 0.60,
        description: 'Alternatif murah dari OpenAI.'
    }
]

const STORAGE_KEY = 'sumopod_selected_model'
const DEFAULT_MODEL = 'gemini/gemini-2.0-flash-lite'

export const getSelectedModel = (): string => {
    if (typeof window === 'undefined') return DEFAULT_MODEL
    const storedModel = localStorage.getItem(STORAGE_KEY)
    if (!storedModel) return DEFAULT_MODEL

    // Validate that the stored model exists in available models
    const isValidModel = AVAILABLE_MODELS.some(m => m.id === storedModel)
    return isValidModel ? storedModel : DEFAULT_MODEL
}

export const setSelectedModel = (modelId: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, modelId)
}

export const getModelDetails = (modelId: string): AIModel | undefined => {
    return AVAILABLE_MODELS.find(m => m.id === modelId)
}
