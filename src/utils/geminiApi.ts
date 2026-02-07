
interface GeminiDobResponse {
    dob: string | null;
    confidence: 'high' | 'medium' | 'low' | 'none';
}

const SUMOPOD_API_KEY = 'sk--0kcvDqTWn7--TFN-AKP_g';
const SUMOPOD_BASE_URL = 'https://ai.sumopod.com/v1';
// Using 'gemini/gemini-2.5-flash' from the user's available models list.
const MODEL = 'gemini/gemini-2.5-flash';

export const getDobFromGemini = async (
    englishName: string,
    jpName: string,
    alias: string
): Promise<GeminiDobResponse> => {
    const prompt = `Kamu adalah ahli data biografi industri hiburan Jepang. Tugasmu mencari tanggal lahir (DOB) yang akurat dari seorang AV Actress.
Data yang diberikan:
Nama Inggris: ${englishName}
Nama Jepang: ${jpName}
Alias: ${alias}

Gunakan data tersebut untuk mencari tanggal lahir di pengetahuan kamu.
Aturan Output:
Jika ketemu: Balas HANYA dengan format JSON: {"dob": "YYYY-MM-DD", "confidence": "high"}.
Jika tidak ketemu atau tidak yakin: Balas dengan JSON: {"dob": null, "confidence": "none"}.
Jangan memberikan teks penjelasan apapun di luar JSON.`;

    console.log('--- Ask AI Debug Start ---');
    console.log('Sending request to SumoPod for:', { englishName, jpName, alias });

    try {
        const response = await fetch(`${SUMOPOD_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUMOPOD_API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that always outputs valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
            }),
        });

        console.log('SumoPod Response Status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('SumoPod API Error Body:', errorData);
            throw new Error(`SumoPod API returned ${response.status}: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('SumoPod Raw Data:', data);

        // Parse OpenAI-compatible response
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            const content = data.choices[0].message.content;
            console.log('SumoPod Content string:', content);

            try {
                // Remove markdown code blocks and whitespace
                const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();

                // Extract JSON object if embedded in text
                const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
                const jsonString = jsonMatch ? jsonMatch[0] : cleanContent;

                const result = JSON.parse(jsonString) as GeminiDobResponse;
                console.log('Parsed Result:', result);
                return result;
            } catch (e) {
                console.error('Failed to parse SumoPod response as JSON:', content);

                // Fallback attempt: try to manually extract DOB if string pattern matches YYYY-MM-DD
                const dateMatch = content.match(/\d{4}-\d{2}-\d{2}/);
                if (dateMatch) {
                    console.log('Fallback: Found date pattern in text:', dateMatch[0]);
                    return { dob: dateMatch[0], confidence: 'low' } as GeminiDobResponse;
                }

                return { dob: null, confidence: 'none' };
            }
        }

        console.warn('Unexpected SumoPod response structure:', data);
        return { dob: null, confidence: 'none' };

    } catch (error) {
        console.error('Error calling SumoPod API:', error);
        throw error;
    } finally {
        console.log('--- Ask AI Debug End ---');
    }
};
